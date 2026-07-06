// RAG indexer — builds the RagChunk store that powers semantic retrieval.
//
// Two phases, independent so you can do the cheap one now and the paid one later:
//   (default)   chunk the corpus (Verse/Source/Evidence/TopicPage/GlossaryEntry)
//               into RagChunk rows with text only. Enables nothing new on its own
//               (FTS/keyword already work) but stages every chunk for embedding.
//   --embed     fill RagChunk.embedding for rows that lack it, via the z.ai
//               embeddings endpoint. THIS is the switch that turns on vector RAG:
//               once any row has an embedding, src/lib/rag-retrieval.ts prefers it.
//
//   node --env-file=.env scripts/rag-index.mjs                 # (re)build text chunks
//   node --env-file=.env scripts/rag-index.mjs --embed         # + embed missing vectors
//   node --env-file=.env scripts/rag-index.mjs --only source   # one kind
//   node --env-file=.env scripts/rag-index.mjs --embed --limit 200
//
// Idempotent: chunks are keyed by contentHash, so re-runs only add what's new.

import { PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const db = new PrismaClient()
const argv = process.argv.slice(2)
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d }
const flag = (f) => argv.includes(f)
const ONLY = (opt('--only', '') || '').split(',').filter(Boolean)
const EMBED = flag('--embed')
const LIMIT = parseInt(opt('--limit', '100000'), 10)
const CHUNK_CHARS = parseInt(opt('--chunk-chars', '1400'), 10)
const OVERLAP = 180
const MAX_CHUNKS_PER_DOC = 8

const KEY = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim() } catch { return '' } })()
const BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4'
const EMBED_MODEL = process.env.ZAI_EMBED_MODEL || 'embedding-3'

const hash = (s) => createHash('sha1').update(s).digest('hex')
const want = (kind) => !ONLY.length || ONLY.includes(kind)

// Scraped web content can carry NUL / control bytes and invalid UTF-8 replacement
// chars that break the SQLite string bind ("unexpected end of hex escape"). Strip them.
const sanitize = (s) => { const norm = Buffer.from(String(s == null ? '' : s), 'utf8').toString('utf8'); let out = ''; for (const ch of norm) { const c = ch.codePointAt(0); if (c === 0xFFFD) continue; if (c < 32 && c !== 9 && c !== 10 && c !== 13) continue; if (c >= 0x7F && c <= 0x9F) continue; if (c >= 0xD800 && c <= 0xDFFF) continue; out += ch } return out }

// Split long text into overlapping windows on sentence-ish boundaries.
function chunkText(text, chars = CHUNK_CHARS) {
  const clean = sanitize(text).replace(/\s+/g, ' ').trim()
  if (clean.length <= chars) return clean ? [clean] : []
  const out = []
  let i = 0
  while (i < clean.length && out.length < MAX_CHUNKS_PER_DOC) {
    let end = Math.min(i + chars, clean.length)
    if (end < clean.length) { const dot = clean.lastIndexOf('. ', end); if (dot > i + chars * 0.5) end = dot + 1 }
    out.push(clean.slice(i, end).trim())
    i = end - OVERLAP
    if (i < 0) i = 0
  }
  return out
}

// Last-resort narrowing: keep tab/newlines, printable ASCII, and Latin(-Extended)
// so transliterations (é, ā, ḥ, Geʿez romanization) survive; drop everything else.
const asciiSafe = (s) => (s || '').replace(/[^\x09\x0A\x0D\x20-\x7E -ɏḀ-ỿ]/g, '')

// Stage one RagChunk (dedup by contentHash). Returns 1 if inserted, 0 if present.
async function stage(kind, refId, ref, title, text, ordinal, credibility) {
  const body = sanitize(text).trim()
  if (body.length < 20) return 0
  const create = async (b, r, t) => {
    const contentHash = hash(`${kind}:${refId}:${ordinal}:${b}`)
    if (await db.ragChunk.findUnique({ where: { contentHash }, select: { id: true } })) return 0
    await db.ragChunk.create({
      data: { kind, refId, ref: r || refId, title: (t || r || kind).slice(0, 300), text: b, ordinal, credibility: credibility ?? 0.5, tokenCount: Math.round(b.length / 4), contentHash },
    })
    return 1
  }
  try {
    return await create(body, sanitize(ref), sanitize(title))
  } catch {
    // Some scraped byte still slipped through — retry ASCII-only, else skip + log.
    try {
      return await create(asciiSafe(body), asciiSafe(sanitize(ref)), asciiSafe(sanitize(title)))
    } catch (e2) {
      console.error(`  ! skip ${kind} ${refId}: ${String(e2.message || e2).split('\n')[0]}`)
      return 0
    }
  }
}

async function buildChunks() {
  let added = 0
  if (want('verse')) {
    const rows = await db.verse.findMany({ include: { book: true }, take: LIMIT })
    for (const v of rows) { const ref = `${v.book.slug} ${v.chapterNum}:${v.verseNum}`; added += await stage('verse', v.id, ref, `${v.book.name} ${v.chapterNum}:${v.verseNum}`, v.text, 0, undefined) }
    console.error(`  verse: scanned ${rows.length}`)
  }
  if (want('source')) {
    const rows = await db.source.findMany({ take: LIMIT, select: { id: true, title: true, url: true, domain: true, summary: true, content: true, credibility: true } })
    for (const s of rows) {
      const base = s.content || s.summary || ''
      const chunks = chunkText(base)
      if (!chunks.length && s.summary) chunks.push(s.summary)
      for (let o = 0; o < chunks.length; o++) added += await stage('source', s.id, s.url || s.id, s.title || s.domain, chunks[o], o, s.credibility)
    }
    console.error(`  source: scanned ${rows.length}`)
  }
  if (want('evidence')) {
    const rows = await db.evidence.findMany({ take: LIMIT, include: { source: { select: { credibility: true } } } })
    for (const e of rows) { const text = [e.claim, e.corroboration, e.notes].filter(Boolean).join(' — '); added += await stage('evidence', e.id, e.scriptureRef, `Evidence on ${e.scriptureRef}`, text, 0, e.source?.credibility) }
    console.error(`  evidence: scanned ${rows.length}`)
  }
  if (want('topic')) {
    const rows = await db.topicPage.findMany({ take: LIMIT, select: { id: true, slug: true, title: true, subtitle: true, bodyMarkdown: true } })
    for (const t of rows) { const chunks = chunkText((t.subtitle ? t.subtitle + '. ' : '') + (t.bodyMarkdown || '')); for (let o = 0; o < chunks.length; o++) added += await stage('topic', t.id, t.slug, t.title, chunks[o], o, 0.7) }
    console.error(`  topic: scanned ${rows.length}`)
  }
  if (want('glossary')) {
    const rows = await db.glossaryEntry.findMany({ take: LIMIT, select: { id: true, term: true, category: true, definition: true } })
    for (const g of rows) added += await stage('glossary', g.id, g.term, `${g.term} (${g.category})`, g.definition, 0, undefined)
    console.error(`  glossary: scanned ${rows.length}`)
  }
  return added
}

// ── z.ai embeddings (OpenAI-shaped) ──────────────────────────────────────────
async function embedBatch(texts) {
  if (!KEY) return texts.map(() => null)
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
    })
    if (!res.ok) { console.error(`  embed HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`); return texts.map(() => null) }
    const data = await res.json()
    const out = texts.map(() => null)
    for (const r of (data?.data ?? [])) { const i = typeof r.index === 'number' ? r.index : 0; if (Array.isArray(r.embedding)) out[i] = r.embedding }
    return out
  } catch (e) { console.error(`  embed error: ${e.message}`); return texts.map(() => null) }
}

async function embedMissing() {
  if (!KEY) { console.error('[rag-index] --embed needs ZAI_API_KEY (env or ~/.config/glm/z-ai.key) — skipping embed phase'); return { embedded: 0, dim: 0 } }
  const pending = await db.ragChunk.findMany({ where: { embedding: null }, select: { id: true, text: true }, take: LIMIT })
  console.error(`[rag-index] embedding ${pending.length} chunks via ${EMBED_MODEL}…`)
  let embedded = 0, dim = 0
  const BATCH = 16
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH)
    const vecs = await embedBatch(slice.map((c) => c.text.slice(0, 4000)))
    for (let j = 0; j < slice.length; j++) {
      const v = vecs[j]
      if (!Array.isArray(v) || !v.length) continue
      dim = v.length
      const buf = Buffer.from(Float32Array.from(v).buffer)
      await db.ragChunk.update({ where: { id: slice[j].id }, data: { embedding: buf, embModel: EMBED_MODEL, embDim: v.length } })
      embedded++
    }
    if (i % 160 === 0) console.error(`  …${embedded}/${pending.length}`)
    await new Promise((r) => setTimeout(r, 300))
  }
  return { embedded, dim }
}

async function main() {
  console.error(`[rag-index] building chunks${ONLY.length ? ' only=' + ONLY.join(',') : ''}${EMBED ? ' + embed' : ''}`)
  const added = await buildChunks()
  const total = await db.ragChunk.count()
  console.error(`[rag-index] +${added} new chunks (total ${total})`)
  if (EMBED) {
    const { embedded, dim } = await embedMissing()
    const withEmb = await db.ragChunk.count({ where: { embedding: { not: null } } })
    console.error(`[rag-index] embedded +${embedded} (dim=${dim}); ${withEmb}/${total} chunks now vector-searchable`)
  } else {
    console.error('[rag-index] text-only. Run again with --embed to enable vector search.')
  }
  await db.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
