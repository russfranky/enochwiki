// RAG endpoint — semantic search over corpus via TF-IDF cosine similarity
// Plus AI-grounded Q&A with verse citations
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── Tiny TF-IDF implementation (no external deps) ────────────────────────────

const STOPWORDS = new Set([
  'the', 'and', 'of', 'in', 'a', 'to', 'is', 'was', 'were', 'for', 'on', 'at', 'by', 'with',
  'from', 'as', 'an', 'it', 'that', 'this', 'these', 'those', 'be', 'are', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'any', 'because',
  'before', 'below', 'between', 'both', 'but', 'each', 'few', 'more', 'most', 'other', 'our',
  'out', 'own', 'same', 'she', 'he', 'they', 'them', 'their', 'we', 'us', 'your', 'yours',
  'its', 'her', 'his', 'him', 'i', 'me', 'my', 'mine', 'into', 'through', 'during', 'until',
  'not', 'no', 'nor', 'only', 'or', 'so', 'than', 'too', 'very', 's', 't', 'just', 'now',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function buildTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1)
  }
  // Normalize by max
  const max = Math.max(...tf.values(), 1)
  for (const [k, v] of tf) tf.set(k, v / max)
  return tf
}

function cosineSim(a: Map<string, number>, b: Map<string, number>, idf: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const [k, v] of a) {
    const idfVal = idf.get(k) || 0
    const aVal = v * idfVal
    normA += aVal * aVal
    const bVal = b.get(k)
    if (bVal !== undefined) {
      dot += aVal * bVal * idfVal
    }
  }
  for (const [k, v] of b) {
    const idfVal = idf.get(k) || 0
    const bVal = v * idfVal
    normB += bVal * bVal
  }
  if (normA === 0 || normB === 0) return 0
  return dot / Math.sqrt(normA * normB)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const topK = parseInt(searchParams.get('topK') || '8', 10)

  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  // Load all verses (we'll cap at 500 for performance)
  const verses = await db.verse.findMany({
    take: 500,
    include: { book: true, chapter: true },
    orderBy: { verseNum: 'asc' },
  })

  if (verses.length === 0) {
    return NextResponse.json({ q, results: [] })
  }

  // Build document tokens
  const docs = verses.map((v) => ({
    id: v.id,
    ref: `${v.book.slug} ${v.chapter.number}:${v.verseNum}`,
    book: v.book.name,
    text: v.text,
    tokens: tokenize(v.text),
  }))

  // Compute IDF
  const N = docs.length
  const df = new Map<string, number>()
  for (const d of docs) {
    const seen = new Set<string>()
    for (const t of d.tokens) seen.add(t)
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1)
  }
  const idf = new Map<string, number>()
  for (const [t, c] of df) {
    idf.set(t, Math.log((N + 1) / (c + 1)) + 1)
  }

  // Compute query TF
  const queryTokens = tokenize(q)
  const queryTf = buildTf(queryTokens)

  // Score each doc
  const scored = docs.map((d) => ({
    ...d,
    score: cosineSim(queryTf, buildTf(d.tokens), idf),
  }))

  // Sort and take top K
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, topK).filter((s) => s.score > 0)

  return NextResponse.json({
    q,
    totalCorpus: N,
    results: top.map((s) => ({
      ref: s.ref,
      book: s.book,
      text: s.text,
      score: s.score,
    })),
  })
}

// POST endpoint — full RAG Q&A with AI grounded in retrieved verses
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, topK = 8 } = body as { question: string; topK?: number }

  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }

  // Step 1: retrieve relevant verses via TF-IDF
  const verses = await db.verse.findMany({
    take: 500,
    include: { book: true, chapter: true },
  })
  const docs = verses.map((v) => ({
    id: v.id,
    ref: `${v.book.slug} ${v.chapter.number}:${v.verseNum}`,
    book: v.book.name,
    text: v.text,
    tokens: tokenize(v.text),
  }))

  const N = docs.length
  const df = new Map<string, number>()
  for (const d of docs) {
    const seen = new Set<string>()
    for (const t of d.tokens) seen.add(t)
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1)
  }
  const idf = new Map<string, number>()
  for (const [t, c] of df) idf.set(t, Math.log((N + 1) / (c + 1)) + 1)

  const queryTf = buildTf(tokenize(question))
  const scored = docs
    .map((d) => ({ ...d, score: cosineSim(queryTf, buildTf(d.tokens), idf) }))
    .sort((a, b) => b.score - a.score)
  const top = scored.slice(0, topK).filter((s) => s.score > 0)

  if (top.length === 0) {
    return NextResponse.json({
      answer: 'I could not find any verses in the local corpus that match your question. Try rephrasing, or use different keywords.',
      sources: [],
    })
  }

  // Step 2: build context block
  const context = top
    .map((s, i) => `[${i + 1}] ${s.ref} — "${s.text}"`)
    .join('\n\n')

  // Step 3: AI grounded Q&A
  const systemPrompt = `You are the AI study tutor for Enoch.Wiki (https://enoch.wiki) — a rigorously corroborated knowledge resource for the Ethiopian Orthodox Bible. A user has asked a question. I have retrieved the most textually-similar verses from the local corpus (1 Enoch, Jubilees, Genesis, 1 Peter).

## Retrieved Verses (use ONLY these as your textual basis)

${context}

## Grounding Rules (NON-NEGOTIABLE)

1. **Every claim must cite a specific verse** by its reference (e.g. "1 Enoch 6:2 says..."). Use the bracketed numbers [1], [2], etc. to refer to the retrieved verses.
2. **Never fabricate citations.** If the retrieved verses don't address the question, say so explicitly.
3. **Label every statement** as one of:
   - **[Text]** — what the verse actually says (paraphrase or quote)
   - **[Scholarship]** — established scholarly consensus (name the scholar/source if known)
   - **[Interpretation]** — devotional or theological reading (label the tradition)
4. If the question requires scholarship or interpretation beyond the retrieved text, you may draw on your general knowledge — but you must label it clearly and not pretend it is in the text.
5. Distinguish faith claims from historical claims.
6. End with a short "For your reflection" section: 1-3 questions drawing the discussion toward wisdom.

## Response Format
Use Markdown. Cite verses as **1 Enoch 6:2**. Keep responses focused and dense.`

  const zai = await ZAI.create()
  let completion
  try {
    completion = await zai.chat.completions.create({
      model: 'glm-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      thinking: { type: 'enabled' },
    } as any)
  } catch (apiErr: any) {
    const errMsg = apiErr?.message || String(apiErr)
    if (errMsg.includes('1113') || errMsg.includes('Insufficient balance') || errMsg.includes('429')) {
      return NextResponse.json({
        error: 'Z.ai API has insufficient balance. Add credits at https://z.ai/ to use RAG.',
        answer: 'I cannot generate a response right now because the Z.ai API account has insufficient balance. Please add credits at https://z.ai/ and try again.',
        sources: top,
      }, { status: 503 })
    }
    throw apiErr
  }

  const answer = completion?.choices?.[0]?.message?.content ?? 'No response generated. The Z.ai API may be unavailable or out of balance.'

  // Save chat message
  await db.chatMessage.create({
    data: {
      role: 'user',
      content: `[RAG] ${question}`,
      context: top.map((s) => s.ref).join(', '),
    },
  })
  await db.chatMessage.create({
    data: {
      role: 'assistant',
      content: answer,
      context: top.map((s) => s.ref).join(', '),
    },
  })

  return NextResponse.json({
    answer,
    sources: top.map((s) => ({
      ref: s.ref,
      book: s.book,
      text: s.text,
      score: s.score,
    })),
  })
}
