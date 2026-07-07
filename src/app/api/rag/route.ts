// RAG endpoint — retrieval over the WHOLE corpus (verses, scholarly sources,
// evidence, topic pages, glossary) + AI-grounded Q&A with citations.
//
// Retrieval lives in src/lib/rag-retrieval.ts behind one seam: it uses vector search
// when chunks are embedded, else SQLite FTS5, else keyword — so this route never
// changes as the backend is upgraded. See docs/rag.md.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { retrieve, buildContext, type ChunkKind } from '@/lib/rag-retrieval'
import { generateAnswer } from '@/lib/rag-answer'

export const runtime = 'nodejs'
export const maxDuration = 90

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
  const { question, topK = 8, kinds: kindsIn, minCredibility, provider = 'auto' } = body as { question: string; topK?: number; kinds?: ChunkKind[]; minCredibility?: number; provider?: 'auto' | 'zai' | 'kilo' }

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

  // Step 3: AI grounded Q&A — z.ai first, kilo (free) fallback on any failure.
  const { answer, provider: usedProvider } = await generateAnswer(question, context, provider)

  if (!answer) {
    return NextResponse.json({
      error: 'No generation provider available (z.ai unavailable and kilo CLI unavailable/failed).',
      answer: 'Retrieval succeeded, but I cannot generate a grounded answer right now. The retrieved sources are returned below so you can read them directly.',
      sources: chunks, backend,
    }, { status: 503 })
  }

  const refs = chunks.map((c) => c.ref).join(', ')

  await db.chatMessage.create({ data: { role: 'user', content: `[RAG] ${question}`, context: refs } })
  await db.chatMessage.create({ data: { role: 'assistant', content: answer, context: refs } })

  return NextResponse.json({
    answer, backend, provider: usedProvider,
    sources: chunks.map((c) => ({ kind: c.kind, ref: c.ref, title: c.title, text: c.text, score: c.score, credibility: c.credibility, citation: c.citation })),
  })
}
