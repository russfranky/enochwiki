// EOTC corpus growth runner — scrapes scholarly context for the Ethiopian
// Orthodox Tewahedo Church's 81-book canon + church-order / liturgy / calendar /
// hagiography / apocrypha corpus, the "glue" that ties the Enoch/Watchers material
// to a living tradition. Reads the worklist in data/eotc-corpus.json, searches each
// entry via the Coding-Plan web_search_prime MCP, reads the top page, and files
// Source (+ Evidence when the entry maps to a scripture locus) + ReviewRecord +
// AuditLog. Same engine, credibility model, and dedup as scrape-grow.mjs.
//
//   node --env-file=.env scripts/eotc-grow.mjs [--offset N] [--limit M]
//        [--only ot-canon,ot-distinctive,...] [--min-cred N] [--recency R] [--dry]
//
// Idempotent: dedups Sources by URL, so re-runs and overlapping batches are safe.

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d }
const flag = (f) => argv.includes(f)
const OFFSET = parseInt(opt('--offset', '0'), 10)
const LIMIT = parseInt(opt('--limit', '9999'), 10)
const MIN_CRED = parseFloat(opt('--min-cred', '0'))
const RECENCY = opt('--recency', null)
const ONLY = (opt('--only', '') || '').split(',').filter(Boolean)
const DRY = flag('--dry')

const db = new PrismaClient()
const KEY = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim() } catch { return '' } })()
const MCP_URL = process.env.ZAI_MCP_WEB_SEARCH_URL || 'https://api.z.ai/api/mcp/web_search_prime/mcp'

// ── category → query flavor + storage bucket ─────────────────────────────────
const CAT = {
  'ot-canon':        { q: 'Old Testament canon',                     bucket: 'comparative-religion' },
  'ot-distinctive':  { q: 'distinctive Old Testament canon',         bucket: 'comparative-religion' },
  'nt-canon':        { q: 'New Testament canon',                     bucket: 'comparative-religion' },
  'nt-church-order': { q: 'broader New Testament church-order canon', bucket: 'comparative-religion' },
  'canon-law':       { q: 'canon law church order',                  bucket: 'history' },
  'theology':        { q: 'theology patristics Christology',         bucket: 'academic' },
  'liturgy':         { q: 'liturgy Qedase Eucharist',                bucket: 'comparative-religion' },
  'hymnody':         { q: 'hymnody chant Yared Deggwa',              bucket: 'comparative-religion' },
  'calendar':        { q: 'calendar computus Abushakir sacred time', bucket: 'science' },
  'history-royal':   { q: 'royal sacred history Kebra Nagast Axum',  bucket: 'history' },
  'hagiography':     { q: 'hagiography gadl saints lives',           bucket: 'history' },
  'marian':          { q: 'Marian devotion Taamra Maryam',          bucket: 'comparative-religion' },
  'apocrypha':       { q: 'apocryphal visionary Ethiopic text',     bucket: 'comparative-religion' },
  'philosophy':      { q: 'philosophy wisdom Geez text',            bucket: 'academic' },
  'nature-science':  { q: 'natural philosophy cosmology Ethiopic',   bucket: 'science' },
  'culture':         { q: 'Ethiopian ritual culture tradition',      bucket: 'history' },
  'research-map':    { q: 'scholarly Second Temple Enoch Watchers',  bucket: 'academic' },
}

// Community / low-trust domains → exploratory leads, never corroboration.
// User-upload doc silos (scribd/slideshare/issuu) are leads too: content may be
// real scholarship but the URL is not an authoritative citation.
const COMMUNITY = ['facebook.com', 'reddit.com', 'quora.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'tiktok.com', 'instagram.com', 'pinterest.com', 'threads.net', 'linkedin.com', 'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com', 'scribd.com', 'slideshare.net', 'issuu.com']
const isCommunity = (d) => COMMUNITY.some((b) => d === b || d.endsWith('.' + b))
// Commercial marketplaces / print-on-demand — listings, not content. Never filed.
const COMMERCIAL = ['ebay.', 'amazon.', 'etsy.', 'walmart.', 'aliexpress', 'alibaba', 'abebooks', 'gumroad', 'redbubble', 'teespring', 'shopify', 'ecwid', 'bookshop.org']
const isCommercial = (d) => COMMERCIAL.some((b) => d.includes(b))
const DOMAIN_CRED = { 'deadseascrolls.org.il': 0.98, 'britishmuseum.org': 0.97, 'metmuseum.org': 0.95, 'nature.com': 0.95, 'science.org': 0.95, 'sciencedirect.com': 0.9, 'jstor.org': 0.92, 'academia.edu': 0.7, 'cambridge.org': 0.92, 'oxfordacademic.com': 0.92, 'brill.com': 0.92, 'biblicalarchaeology.org': 0.9, 'asor.org': 0.88, 'bibleinterp.com': 0.85, 'loc.gov': 0.9, 'israelantiquities.org': 0.92, 'britishlibrary.org': 0.9, 'bl.uk': 0.9, 'betamasaheft.eu': 0.9, 'ethiopianorthodox.org': 0.8, 'eotc.org': 0.8, 'wikipedia.org': 0.65 }
const SCHOLARLY = ['.edu', 'brill.com', 'jstor.org', 'cambridge.org', 'oxford', 'academia.edu', 'betamasaheft', 'britishlibrary', 'bl.uk', 'loc.gov', 'degruyter', 'doi.org', 'archive.org', 'sbl-site', 'bibleinterp']
const isScholarly = (d) => SCHOLARLY.some((s) => d.includes(s))
function scoreCredibility(domain, snippet) {
  let base = DOMAIN_CRED[domain] ?? (isScholarly(domain) ? 0.8 : 0.55)
  if (domain.includes('blog') || domain.includes('forum')) base = Math.min(base - 0.15, 0.4)
  const lower = (snippet || '').toLowerCase()
  if (/(manuscript|codex|geez|ge'ez|critical edition|peer-review|university press|doi|catalogue)/.test(lower)) base = Math.min(base + 0.05, 0.99)
  return base
}
const tier = (c) => (c >= 0.9 ? 'peer-reviewed' : c >= 0.75 ? 'reputable-reference' : c >= 0.55 ? 'popular-journalistic' : 'self-published')
function classify(domain, snippet) {
  if (isCommunity(domain)) return { credibility: 0.4, tierName: 'community-lead', isLead: true }
  const credibility = scoreCredibility(domain, snippet)
  return { credibility, tierName: tier(credibility), isLead: credibility < 0.55 }
}

// ── MCP web search (mirror of scrape-grow.mjs) ───────────────────────────────
async function mcpRpc(method, params, sid, id = 1) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sid ? { 'Mcp-Session-Id': sid } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`MCP ${method} ${res.status}: ${text.slice(0, 160)}`)
  let json = null
  for (let line of text.split('\n')) { line = line.trim(); if (line.startsWith('data:')) line = line.slice(5).trim(); if (line.startsWith('{')) { try { json = JSON.parse(line); break } catch { /**/ } } }
  return { sid: res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id') || undefined, json }
}
async function webSearch(query, num = 5) {
  const init = await mcpRpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'enochwiki-eotc', version: '1' } })
  const args = { search_query: query }
  if (RECENCY) args.search_recency_filter = RECENCY
  const { json } = await mcpRpc('tools/call', { name: 'web_search_prime', arguments: args }, init.sid, 3)
  if (!json?.result) throw new Error(`web_search_prime: ${json?.error ? JSON.stringify(json.error) : 'no result'}`)
  let parsed = json.result.content?.[0]?.text ?? ''
  for (let i = 0; i < 2; i++) if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { break } }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((r) => r && (r.link || r.url)).slice(0, num).map((r, i) => ({ url: r.link || r.url, name: r.title || r.link, snippet: r.content || '', rank: i }))
}
async function readPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EnochWikiBot/1.0; +https://enoch.wiki/bot)' }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const html = await res.text()
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || ''
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 12000)
    return { title, text }
  } catch { return null }
}
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'unknown' } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function buildQuery(e) {
  if (e.q) return e.q
  const flavor = CAT[e.cat]?.q || 'Ethiopic scholarly'
  return `"${e.name}" Ethiopian Orthodox Tewahedo Church ${flavor} Geez scholarly`
}

async function main() {
  if (!KEY) { console.error('no ZAI_API_KEY (env or ~/.config/glm/z-ai.key)'); process.exit(1) }
  const worklist = JSON.parse(readFileSync(join(here, '..', 'data', 'eotc-corpus.json'), 'utf8'))
  let entries = worklist.entries || []
  if (ONLY.length) entries = entries.filter((e) => ONLY.includes(e.cat))
  const batch = entries.slice(OFFSET, OFFSET + LIMIT)
  console.error(`[eotc-grow] ${entries.length} entries; batch [${OFFSET}..${OFFSET + batch.length}) = ${batch.length}${ONLY.length ? ' only=' + ONLY.join(',') : ''}${RECENCY ? ' recency=' + RECENCY : ''}${DRY ? ' (dry)' : ''}\n`)
  let processed = 0, sourcesAdded = 0, evidenceAdded = 0, leadsAdded = 0, skipped = 0
  for (const e of batch) {
    processed++
    const query = buildQuery(e)
    if (DRY) { console.error(`  · ${e.cat} | ${e.name} → ${query}`); continue }
    let results
    try { results = await webSearch(query, 5) } catch (err) { console.error(`  ✗ ${e.name}: ${err.message}`); await sleep(1500); continue }
    if (!results.length) { console.error(`  · ${e.name}: no results`); skipped++; await sleep(1200); continue }
    console.error(`  ▸ ${e.cat} | ${e.name} → ${results.length} results`)
    const bucket = CAT[e.cat]?.bucket || 'comparative-religion'
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i]
      if (!r.url) continue
      const domain = hostOf(r.url)
      if (isCommercial(domain)) { skipped++; continue } // marketplace listing — noise
      const snippet = r.snippet || r.name || ''
      const { credibility, tierName, isLead } = classify(domain, snippet)
      if (credibility < MIN_CRED) { skipped++; continue }
      if (await db.source.findUnique({ where: { url: r.url } })) { skipped++; continue }
      let content = null, summary = snippet, title = r.name || r.url
      if (i === 0) { const page = await readPage(r.url); if (page?.text) { content = page.text; if (page.title) title = page.title; const s = page.text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' '); if (s.length > 80) summary = s } }
      const created = await db.source.create({
        data: { url: r.url, title, domain, category: isLead ? 'community-lead' : bucket, credibilityTier: tierName, credibility, author: null, summary, content, keywords: `eotc: ${e.cat}: ${e.name}`, publishedAt: null },
      })
      sourcesAdded++; if (isLead) leadsAdded++
      console.error(`      + ${isLead ? '◇lead ' : '◆schol'} ${domain} (${(credibility * 100).toFixed(0)}%) ${r.url.slice(0, 62)}`)
      if (e.ref) {
        const reviewState = isLead ? 'draft' : 'auto-corroborated'
        const ev = await db.evidence.create({
          data: { sourceId: created.id, scriptureRef: e.ref, scriptureText: null, claim: `EOTC canon/tradition context: ${e.name}`, corroboration: summary || snippet, alignment: isLead ? 'neutral' : 'contextualizes', confidence: credibility * 0.65, notes: `EOTC corpus grow — ${e.name} (${e.cat}).${e.note ? ' ' + e.note : ''}${isLead ? ' Community lead — corroborate.' : ''}`, reviewState, blindspot: isLead || credibility < 0.6 },
        })
        await db.reviewRecord.create({ data: { itemType: 'evidence', itemId: ev.id, state: reviewState, reviewer: 'eotc-grow', reviewerRole: 'contributor', notes: `EOTC: ${e.name}`, version: 1 } })
        await db.auditLog.create({ data: { action: 'create', itemType: 'evidence', itemId: ev.id, actor: 'eotc-grow', actorRole: 'contributor', details: JSON.stringify({ name: e.name, cat: e.cat, url: r.url, credibility, isLead }) } })
        evidenceAdded++
      }
    }
    await sleep(1500)
  }
  const [sources, evidence] = await Promise.all([db.source.count(), db.evidence.count()])
  console.error(`\n[eotc-grow] done: processed=${processed} +sources=${sourcesAdded} (leads=${leadsAdded}) +evidence=${evidenceAdded} skipped=${skipped}`)
  console.error(`[eotc-grow] DB totals → sources=${sources} evidence=${evidence}`)
  await db.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
