// RAG endpoint — retrieval over the WHOLE corpus (verses, scholarly sources,
// evidence, topic pages, glossary) + AI-grounded Q&A with citations.
//
// Retrieval lives in src/lib/rag-retrieval.ts behind one seam: it uses vector search
// when chunks are embedded, else SQLite FTS5, else keyword — so this route never
// changes as the backend is upgraded. See docs/rag.md.
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { retrieve, buildContext, type ChunkKind } from '@/lib/rag-retrieval'

export const runtime = 'nodejs'
export const maxDuration = 60

function parseKinds(param: string | null): ChunkKind[] | undefined {
  if (!param) return undefined
  const allowed: ChunkKind[] = ['verse', 'source', 'evidence', 'topic', 'glossary']
  const picked = param.split(',').map((s) => s.trim()).filter((s): s is ChunkKind => (allowed as string[]).includes(s))
  return picked.length ? picked : undefined
}

// GET — semantic/keyword retrieval over the corpus (no generation).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const topK = parseInt(searchParams.get('topK') || '8', 10)
  const kinds = parseKinds(searchParams.get('kinds'))
  const minCredibility = searchParams.get('minCredibility') ? parseFloat(searchParams.get('minCredibility')!) : undefined

  if (!q || q.length < 3) return NextResponse.json({ error: 'Query too short' }, { status: 400 })

  const { chunks, backend } = await retrieve(q, { k: topK, kinds, minCredibility })
  return NextResponse.json({
    q,
    backend, // "vector" | "fts" | "keyword" — how these results were retrieved
    results: chunks.map((c) => ({ kind: c.kind, ref: c.ref, title: c.title, text: c.text, score: c.score, credibility: c.credibility, citation: c.citation })),
  })
}

// POST — full RAG Q&A: retrieve across the corpus, then answer grounded in the hits.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, topK = 8, kinds: kindsIn, minCredibility } = body as { question: string; topK?: number; kinds?: ChunkKind[]; minCredibility?: number }

  if (!question || typeof question !== 'string') return NextResponse.json({ error: 'Question required' }, { status: 400 })

  // Step 1: retrieve across the whole corpus (backend auto-selected).
  const { chunks, backend } = await retrieve(question, { k: topK, kinds: kindsIn, minCredibility })

  if (chunks.length === 0) {
    return NextResponse.json({
      answer: 'I could not find anything in the local corpus that matches your question. Try rephrasing, or broaden the terms.',
      sources: [], backend,
    })
  }

  // Step 2: citation-tagged context block.
  const context = buildContext(chunks)

  // Step 3: AI grounded Q&A.
  const systemPrompt = `You are the AI study tutor for Enoch.Wiki (https://enoch.wiki) — a rigorously corroborated knowledge resource for the Ethiopian Orthodox Tewahedo Bible and its wider sacred-text tradition (1 Enoch, Jubilees, the Meqabyan, church-order and liturgical texts, plus the scholarship that corroborates them). A user asked a question, and I retrieved the most relevant items from the local corpus below.

## Retrieved corpus items (your ONLY evidentiary basis)

${context}

## Grounding Rules (NON-NEGOTIABLE)

1. **Cite by the bracketed number and reference** — e.g. "[3] 1 Enoch 6:2 says…", "[5] (source: …) reports…". Never invent a citation.
2. Each retrieved item is tagged with its **kind** (verse | source | evidence | topic | glossary) and, for sources/evidence, a **credibility** score. Weight higher-credibility, peer-reviewed material above low-credibility community "leads," and say so when your basis is thin.
3. **Label every statement**: **[Text]** (what a scripture verse says) · **[Scholarship]** (established academic consensus — name the scholar/source) · **[Interpretation]** (devotional/theological reading — name the tradition, e.g. Ethiopian Orthodox Tewahedo).
4. If the retrieved items don't address the question, say so plainly rather than guessing. You may add clearly-labeled general knowledge, but never present it as corpus-sourced.
5. Distinguish faith claims from historical claims.
6. End with a short "For your reflection" section: 1-3 questions drawing toward wisdom.

## Format
Markdown, dense and focused. Cite references in **bold**.`

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
        error: 'Z.ai API has insufficient balance. Add credits at https://z.ai/ to use RAG generation.',
        answer: 'Retrieval succeeded, but I cannot generate a grounded answer right now because the Z.ai chat quota is exhausted. The retrieved sources are returned below so you can read them directly.',
        sources: chunks, backend,
      }, { status: 503 })
    }
    throw apiErr
  }

  const answer = completion?.choices?.[0]?.message?.content ?? 'No response generated. The Z.ai API may be unavailable or out of balance.'
  const refs = chunks.map((c) => c.ref).join(', ')

  await db.chatMessage.create({ data: { role: 'user', content: `[RAG] ${question}`, context: refs } })
  await db.chatMessage.create({ data: { role: 'assistant', content: answer, context: refs } })

  return NextResponse.json({
    answer, backend,
    sources: chunks.map((c) => ({ kind: c.kind, ref: c.ref, title: c.title, text: c.text, score: c.score, credibility: c.credibility, citation: c.citation })),
  })
}
