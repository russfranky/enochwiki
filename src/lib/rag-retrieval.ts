// Unified corpus retrieval for RAG.
//
// The point of this module: retrieval that spans the WHOLE knowledge base — verses,
// scholarly Sources, Evidence, TopicPages, GlossaryEntries — behind ONE seam, so the
// /api/rag route (and anything else) never has to know how retrieval is implemented.
//
// Backends, in order of preference (all selected behind `retrieve()`):
//   1. "vector"  — cosine over RagChunk.embedding. DORMANT until chunks are embedded;
//                  auto-selected the moment any embedded chunks exist.
//   2. "fts"     — SQLite FTS5 (verses_fts / sources_fts / evidence_fts). Default once
//                  the FTS tables are built (scripts/setup-fts.ts).
//   3. "keyword" — Prisma `contains` + token-overlap scoring. Always works, zero setup.
//
// Turning on semantic search later is a flip, not a rewrite (see docs/rag.md):
//   1. bun scripts/rag-index.mjs         # build RagChunk rows (text)
//   2. bun scripts/rag-index.mjs --embed # fill RagChunk.embedding via z.ai
//   → `retrieve()` starts returning vector hits automatically.

import { db } from '@/lib/db'
import { embedText } from '@/lib/zai-api'

export type ChunkKind = 'verse' | 'source' | 'evidence' | 'topic' | 'glossary'
export type RagBackend = 'auto' | 'vector' | 'fts' | 'keyword'

export interface RetrievedChunk {
  kind: ChunkKind
  id: string
  ref: string // citation handle: scriptureRef | url | slug | term
  title: string
  text: string
  score: number // 0..1 normalized relevance
  credibility?: number // 0..1 (sources/evidence); undefined for scripture/glossary
  citation: string // human-readable
}

export interface RetrieveOptions {
  k?: number
  kinds?: ChunkKind[]
  backend?: RagBackend
  minCredibility?: number
}

const DEFAULT_KINDS: ChunkKind[] = ['verse', 'source', 'evidence', 'topic', 'glossary']

const STOPWORDS = new Set(['the', 'and', 'of', 'in', 'a', 'to', 'is', 'was', 'were', 'for', 'on', 'at', 'by', 'with', 'from', 'as', 'an', 'it', 'that', 'this', 'these', 'those', 'be', 'are', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'what', 'who', 'why', 'how', 'when', 'where', 'which', 'about', 'into', 'not', 'or', 'so', 'than', 'too', 'very'])

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

// FTS5 MATCH expression: OR the sanitized terms for recall; quote each to avoid
// syntax errors from stray operators/punctuation.
function ftsMatchExpr(query: string): string {
  const terms = Array.from(new Set(tokenize(query)))
  if (!terms.length) return ''
  return terms.map((t) => `"${t}"`).join(' OR ')
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

// bm25() returns lower = better (0 best, more positive = worse). Map a per-kind set
// of bm25 ranks to 0..1 where the best hit ≈ 1.
function bm25ToScore(rank: number, best: number, worst: number): number {
  if (!isFinite(rank)) return 0
  if (worst === best) return 1
  return clamp01(1 - (rank - best) / (worst - best))
}

// ── FTS5 backend ─────────────────────────────────────────────────────────────
// Each helper returns raw hits; throws if the FTS virtual table is absent, which
// bubbles up to retrieve() and triggers the keyword fallback.

async function ftsSources(match: string, k: number): Promise<RetrievedChunk[]> {
  const rows = await db.$queryRawUnsafe<any[]>(
    `SELECT s.id AS id, s.title AS title, s.summary AS summary, s.content AS content,
            s.url AS url, s.domain AS domain, s.credibility AS credibility,
            bm25(sources_fts) AS rank
       FROM sources_fts JOIN "Source" s ON s.rowid = sources_fts.rowid
      WHERE sources_fts MATCH ? ORDER BY rank LIMIT ?`, match, k)
  const ranks = rows.map((r) => Number(r.rank))
  const best = Math.min(...ranks, 0), worst = Math.max(...ranks, 0)
  return rows.map((r) => ({
    kind: 'source' as const, id: String(r.id), ref: r.url || r.id,
    title: r.title || r.domain || 'Source',
    text: (r.summary || r.content || '').slice(0, 1200),
    score: bm25ToScore(Number(r.rank), best, worst) * (0.6 + 0.4 * (r.credibility ?? 0.5)),
    credibility: r.credibility ?? undefined,
    citation: `${r.title || r.domain} — ${r.url}`,
  }))
}

async function ftsEvidence(match: string, k: number): Promise<RetrievedChunk[]> {
  const rows = await db.$queryRawUnsafe<any[]>(
    `SELECT e.id AS id, e.scriptureRef AS sref, e.claim AS claim, e.corroboration AS corroboration,
            e.notes AS notes, s.credibility AS credibility, s.url AS url, s.title AS stitle,
            bm25(evidence_fts) AS rank
       FROM evidence_fts JOIN "Evidence" e ON e.rowid = evidence_fts.rowid
       LEFT JOIN "Source" s ON s.id = e.sourceId
      WHERE evidence_fts MATCH ? ORDER BY rank LIMIT ?`, match, k)
  const ranks = rows.map((r) => Number(r.rank))
  const best = Math.min(...ranks, 0), worst = Math.max(...ranks, 0)
  return rows.map((r) => ({
    kind: 'evidence' as const, id: String(r.id), ref: r.sref || r.id,
    title: `Evidence on ${r.sref}`,
    text: [r.claim, r.corroboration].filter(Boolean).join(' — ').slice(0, 1200),
    score: bm25ToScore(Number(r.rank), best, worst) * (0.6 + 0.4 * (r.credibility ?? 0.5)),
    credibility: r.credibility ?? undefined,
    citation: `${r.sref}${r.stitle ? ` (via ${r.stitle})` : ''}${r.url ? ` — ${r.url}` : ''}`,
  }))
}

async function ftsVerses(match: string, k: number): Promise<RetrievedChunk[]> {
  const rows = await db.$queryRawUnsafe<any[]>(
    `SELECT v.id AS id, v.text AS text, v.verseNum AS verseNum, v.chapterNum AS chapterNum,
            b.slug AS bookSlug, b.name AS bookName, bm25(verses_fts) AS rank
       FROM verses_fts JOIN "Verse" v ON v.rowid = verses_fts.rowid
       JOIN "Book" b ON b.id = v.bookId
      WHERE verses_fts MATCH ? ORDER BY rank LIMIT ?`, match, k)
  const ranks = rows.map((r) => Number(r.rank))
  const best = Math.min(...ranks, 0), worst = Math.max(...ranks, 0)
  return rows.map((r) => {
    const ref = `${r.bookSlug} ${r.chapterNum}:${r.verseNum}`
    return {
      kind: 'verse' as const, id: String(r.id), ref, title: `${r.bookName} ${r.chapterNum}:${r.verseNum}`,
      text: r.text || '', score: bm25ToScore(Number(r.rank), best, worst),
      citation: ref,
    }
  })
}

async function ftsRetrieve(query: string, kinds: ChunkKind[], k: number): Promise<RetrievedChunk[]> {
  const match = ftsMatchExpr(query)
  if (!match) return []
  const per = Math.max(k, 6)
  const jobs: Promise<RetrievedChunk[]>[] = []
  if (kinds.includes('source')) jobs.push(ftsSources(match, per))
  if (kinds.includes('evidence')) jobs.push(ftsEvidence(match, per))
  if (kinds.includes('verse')) jobs.push(ftsVerses(match, per))
  // topic/glossary aren't in FTS5 yet — fold them in from the keyword backend.
  if (kinds.includes('topic')) jobs.push(keywordTopics(query, per))
  if (kinds.includes('glossary')) jobs.push(keywordGlossary(query, per))
  const all = (await Promise.all(jobs)).flat()
  return all
}

// ── Keyword backend (no FTS required) ────────────────────────────────────────

function overlapScore(tokens: string[], text: string): number {
  if (!tokens.length) return 0
  const hay = text.toLowerCase()
  let hits = 0
  for (const t of tokens) if (hay.includes(t)) hits++
  return hits / tokens.length
}

async function keywordSources(query: string, k: number): Promise<RetrievedChunk[]> {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const rows = await db.source.findMany({
    where: { OR: tokens.flatMap((t) => [{ title: { contains: t } }, { summary: { contains: t } }, { content: { contains: t } }, { keywords: { contains: t } }]) },
    take: k * 3, select: { id: true, title: true, summary: true, content: true, url: true, domain: true, credibility: true },
  })
  return rows.map((r) => ({
    kind: 'source' as const, id: r.id, ref: r.url || r.id, title: r.title || r.domain,
    text: (r.summary || r.content || '').slice(0, 1200),
    score: overlapScore(tokens, `${r.title} ${r.summary} ${r.content}`) * (0.6 + 0.4 * (r.credibility ?? 0.5)),
    credibility: r.credibility ?? undefined, citation: `${r.title || r.domain} — ${r.url}`,
  })).sort((a, b) => b.score - a.score).slice(0, k)
}

async function keywordEvidence(query: string, k: number): Promise<RetrievedChunk[]> {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const rows = await db.evidence.findMany({
    where: { OR: tokens.flatMap((t) => [{ claim: { contains: t } }, { corroboration: { contains: t } }, { scriptureRef: { contains: t } }, { notes: { contains: t } }]) },
    take: k * 3, include: { source: { select: { credibility: true, url: true, title: true } } },
  })
  return rows.map((r) => ({
    kind: 'evidence' as const, id: r.id, ref: r.scriptureRef, title: `Evidence on ${r.scriptureRef}`,
    text: [r.claim, r.corroboration].filter(Boolean).join(' — ').slice(0, 1200),
    score: overlapScore(tokens, `${r.claim} ${r.corroboration} ${r.notes ?? ''}`) * (0.6 + 0.4 * (r.source?.credibility ?? 0.5)),
    credibility: r.source?.credibility ?? undefined,
    citation: `${r.scriptureRef}${r.source?.title ? ` (via ${r.source.title})` : ''}${r.source?.url ? ` — ${r.source.url}` : ''}`,
  })).sort((a, b) => b.score - a.score).slice(0, k)
}

async function keywordVerses(query: string, k: number): Promise<RetrievedChunk[]> {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const rows = await db.verse.findMany({
    where: { OR: tokens.map((t) => ({ text: { contains: t } })) },
    take: k * 3, include: { book: true },
  })
  return rows.map((r) => {
    const ref = `${r.book.slug} ${r.chapterNum}:${r.verseNum}`
    return { kind: 'verse' as const, id: r.id, ref, title: `${r.book.name} ${r.chapterNum}:${r.verseNum}`, text: r.text, score: overlapScore(tokens, r.text), citation: ref }
  }).sort((a, b) => b.score - a.score).slice(0, k)
}

async function keywordTopics(query: string, k: number): Promise<RetrievedChunk[]> {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const rows = await db.topicPage.findMany({
    where: { OR: tokens.flatMap((t) => [{ title: { contains: t } }, { subtitle: { contains: t } }, { bodyMarkdown: { contains: t } }, { seoKeywords: { contains: t } }]) },
    take: k * 2, select: { id: true, slug: true, title: true, subtitle: true, bodyMarkdown: true },
  })
  return rows.map((r) => ({
    kind: 'topic' as const, id: r.id, ref: r.slug, title: r.title,
    text: (r.subtitle ? r.subtitle + ' — ' : '') + (r.bodyMarkdown || '').slice(0, 1200),
    score: overlapScore(tokens, `${r.title} ${r.subtitle ?? ''} ${r.bodyMarkdown}`),
    citation: `Topic: ${r.title} (/${r.slug})`,
  })).sort((a, b) => b.score - a.score).slice(0, k)
}

async function keywordGlossary(query: string, k: number): Promise<RetrievedChunk[]> {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const rows = await db.glossaryEntry.findMany({
    where: { OR: tokens.flatMap((t) => [{ term: { contains: t } }, { definition: { contains: t } }]) },
    take: k * 2, select: { id: true, term: true, definition: true, category: true, scriptureRefs: true },
  })
  return rows.map((r) => ({
    kind: 'glossary' as const, id: r.id, ref: r.term, title: `${r.term} (${r.category})`,
    text: r.definition, score: overlapScore(tokens, `${r.term} ${r.definition}`),
    citation: `Glossary: ${r.term}`,
  })).sort((a, b) => b.score - a.score).slice(0, k)
}

async function keywordRetrieve(query: string, kinds: ChunkKind[], k: number): Promise<RetrievedChunk[]> {
  const jobs: Promise<RetrievedChunk[]>[] = []
  if (kinds.includes('source')) jobs.push(keywordSources(query, k))
  if (kinds.includes('evidence')) jobs.push(keywordEvidence(query, k))
  if (kinds.includes('verse')) jobs.push(keywordVerses(query, k))
  if (kinds.includes('topic')) jobs.push(keywordTopics(query, k))
  if (kinds.includes('glossary')) jobs.push(keywordGlossary(query, k))
  return (await Promise.all(jobs)).flat()
}

// ── Vector backend (dormant until chunks are embedded) ───────────────────────

function bufToFloat32(buf: Buffer | Uint8Array): Float32Array {
  const u8 = buf instanceof Buffer ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf
  return new Float32Array(u8.buffer, u8.byteOffset, Math.floor(u8.byteLength / 4))
}
function cosine(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length)
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb)
}

/** True once any chunk carries an embedding — the switch that enables vector RAG. */
export async function hasEmbeddings(): Promise<boolean> {
  try { return (await db.ragChunk.count({ where: { embedding: { not: null } } })) > 0 } catch { return false }
}

async function vectorRetrieve(query: string, kinds: ChunkKind[], k: number): Promise<RetrievedChunk[]> {
  const qvec = await embedText(query)
  if (!qvec) return [] // embeddings unavailable (no key/balance) → caller falls back
  const q = Float32Array.from(qvec)
  // Brute-force cosine is fine at corpus scale (a few thousand chunks). Swap for
  // sqlite-vec / a vector index here when the corpus outgrows memory (docs/rag.md).
  const rows = await db.ragChunk.findMany({
    where: { embedding: { not: null }, kind: { in: kinds } },
    select: { id: true, kind: true, refId: true, ref: true, title: true, text: true, credibility: true, embedding: true },
  })
  const scored = rows.map((r) => ({
    kind: r.kind as ChunkKind, id: r.refId, ref: r.ref, title: r.title, text: r.text,
    credibility: r.credibility, citation: r.ref,
    score: r.embedding ? cosine(q, bufToFloat32(r.embedding as Buffer)) : 0,
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, k)
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

function mergeDedup(chunks: RetrievedChunk[], k: number, minCred: number): RetrievedChunk[] {
  const byRef = new Map<string, RetrievedChunk>()
  for (const c of chunks) {
    if (c.credibility !== undefined && c.credibility < minCred) continue
    const key = `${c.kind}:${c.ref}`
    const prev = byRef.get(key)
    if (!prev || c.score > prev.score) byRef.set(key, c)
  }
  return Array.from(byRef.values()).sort((a, b) => b.score - a.score).slice(0, k)
}

/**
 * Retrieve the most relevant chunks across the whole corpus.
 * Backend is chosen automatically (vector → fts → keyword); override with opts.backend.
 */
export async function retrieve(query: string, opts: RetrieveOptions = {}): Promise<{ chunks: RetrievedChunk[]; backend: Exclude<RagBackend, 'auto'> }> {
  const k = opts.k ?? 8
  const kinds = opts.kinds ?? DEFAULT_KINDS
  const minCred = opts.minCredibility ?? 0
  const want = opts.backend ?? 'auto'

  if (want === 'vector' || want === 'auto') {
    if (want === 'vector' || (await hasEmbeddings())) {
      try {
        const v = await vectorRetrieve(query, kinds, k)
        if (v.length) return { chunks: mergeDedup(v, k, minCred), backend: 'vector' }
      } catch { /* fall through */ }
    }
  }
  if (want === 'fts' || want === 'auto') {
    try {
      const f = await ftsRetrieve(query, kinds, k)
      if (f.length) return { chunks: mergeDedup(f, k, minCred), backend: 'fts' }
    } catch { /* FTS tables absent → keyword */ }
  }
  const kw = await keywordRetrieve(query, kinds, k)
  return { chunks: mergeDedup(kw, k, minCred), backend: 'keyword' }
}

/** Format retrieved chunks into a citation-tagged context block for an LLM prompt. */
export function buildContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c, i) => {
    const cred = c.credibility !== undefined ? ` · credibility ${(c.credibility * 100).toFixed(0)}%` : ''
    return `[${i + 1}] (${c.kind}: ${c.ref}${cred})\n${c.text}`
  }).join('\n\n')
}
