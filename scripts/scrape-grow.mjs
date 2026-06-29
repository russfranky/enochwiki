// Headless database growth runner — drives the same pipeline as /api/auto-grow,
// runnable from the CLI under plain Node (no tsx/bun: bun's fetch can't reach the
// egress proxy, and tsx/esbuild can't fetch their binaries in this sandbox).
//
//   node --env-file=.env scripts/scrape-grow.mjs [mode] [limit] [--min-cred N] [--recency R]
//     mode      = film-topics | themes | verses | all   (default: all)
//     limit     = max work items to process              (default: 12)
//     --min-cred = drop sources below this credibility    (default: 0.6)
//     --recency  = oneDay | oneWeek | oneMonth | oneYear  (passed to web search)
//
// Web search uses the live Coding Plan MCP `web_search_prime` tool (same endpoint
// as src/lib/zai-api.ts). Creates Source + Evidence + ReviewRecord + AuditLog
// rows, deduping by URL, rate-limited ~1 search / 1.5s.
//
// Two source classes are kept (open-minded mapping, but never conflated):
//   • scholarly       → credibility ≥ 0.55, Evidence reviewState 'auto-corroborated'
//   • community-lead  → social / forum / video / user blogs: low credibility,
//                       Evidence reviewState 'draft' + blindspot=true + alignment
//                       'neutral'. Captured as starting points to dig deeper and
//                       corroborate — explicitly NOT treated as canon.

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const rawArgs = process.argv.slice(2)
// --min-cred drops sources below a floor (default 0: keep everything, leads included).
// --leads-only / --scholarly-only restrict a run to one class.
let MIN_CRED = 0, RECENCY, ONLY
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--min-cred') { MIN_CRED = parseFloat(rawArgs[i + 1]); rawArgs.splice(i, 2); i-- }
  else if (rawArgs[i] === '--recency') { RECENCY = rawArgs[i + 1]; rawArgs.splice(i, 2); i-- }
  else if (rawArgs[i] === '--scholarly-only') { ONLY = 'scholarly'; rawArgs.splice(i, 1); i-- }
  else if (rawArgs[i] === '--leads-only') { ONLY = 'lead'; rawArgs.splice(i, 1); i-- }
}
const MODE = rawArgs[0] || 'all'
const LIMIT = parseInt(rawArgs[1] || '12', 10)
const db = new PrismaClient()

// Community / discussion / social / video / user-blog domains. Kept as exploratory
// LEADS (low credibility, flagged for review) — not scholarly corroboration.
const COMMUNITY_DOMAINS = [
  'facebook.com', 'reddit.com', 'quora.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
  'tiktok.com', 'instagram.com', 'pinterest.com', 'threads.net', 'linkedin.com',
  'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com',
]
const isCommunity = (domain) => COMMUNITY_DOMAINS.some((b) => domain === b || domain.endsWith('.' + b))

// Classify a hit into { credibility, tierName, isLead }. Community domains and
// low-scored unknowns become leads; established scholarly domains stay corroboration.
function classify(domain, snippet) {
  if (isCommunity(domain)) return { credibility: 0.4, tierName: 'community-lead', isLead: true }
  const credibility = scoreCredibility(domain, snippet)
  const isLead = credibility < 0.55
  return { credibility, tierName: isLead ? 'self-published' : tier(credibility), isLead }
}

const KEY = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim() } catch { return '' } })()
const MCP_URL = process.env.ZAI_MCP_WEB_SEARCH_URL || 'https://api.z.ai/api/mcp/web_search_prime/mcp'

// ── MCP web search (mirror of src/lib/zai-api.ts mcpWebSearch) ───────────────
async function mcpRpc(method, params, sid, id = 1) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream', ...(sid ? { 'Mcp-Session-Id': sid } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`MCP ${method} ${res.status}: ${text.slice(0, 160)}`)
  let json = null
  for (let line of text.split('\n')) {
    line = line.trim()
    if (line.startsWith('data:')) line = line.slice(5).trim()
    if (line.startsWith('{')) { try { json = JSON.parse(line); break } catch { /* keep scanning */ } }
  }
  return { sid: res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id') || undefined, json }
}

async function webSearch(query, num = 5) {
  const init = await mcpRpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'enochwiki', version: '1' } })
  const searchArgs = { search_query: query }
  if (RECENCY) searchArgs.search_recency_filter = RECENCY
  const { json } = await mcpRpc('tools/call', { name: 'web_search_prime', arguments: searchArgs }, init.sid, 3)
  if (!json?.result) throw new Error(`web_search_prime: ${json?.error ? JSON.stringify(json.error) : 'no result'}`)
  let parsed = json.result.content?.[0]?.text ?? ''
  for (let i = 0; i < 2; i++) { if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { break } } }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((r) => r && (r.link || r.url)).slice(0, num).map((r, i) => ({
    url: r.link || r.url, name: r.title || r.link, snippet: r.content || '', rank: i,
  }))
}

// ── Optional page read (direct fetch, free) ──────────────────────────────────
async function readPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EnochWikiBot/1.0; +https://enoch.wiki/bot)' }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const html = await res.text()
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || ''
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 12000)
    return { title, text }
  } catch { return null }
}

// ── Credibility helpers (mirror of /api/auto-grow) ───────────────────────────
const DOMAIN_CREDIBILITY = {
  'deadseascrolls.org.il': 0.98, 'britishmuseum.org': 0.97, 'metmuseum.org': 0.95, 'nature.com': 0.95,
  'science.org': 0.95, 'sciencedirect.com': 0.9, 'jstor.org': 0.92, 'academia.edu': 0.7, 'cambridge.org': 0.92,
  'oxfordacademic.com': 0.92, 'brill.com': 0.92, 'biblicalarchaeology.org': 0.9, 'asor.org': 0.88,
  'bibleinterp.com': 0.85, 'smithsonianmag.com': 0.85, 'livescience.com': 0.75, 'haaretz.com': 0.7,
  'israelantiquities.org': 0.92, 'loc.gov': 0.9, 'scholarworks.uni.edu': 0.85, 'wikipedia.org': 0.65,
}
const CATEGORY_KEYWORDS = [
  ['archaeology', ['excavation', 'qumran', 'scrolls', 'tel', 'stratum', 'pottery', 'ostracon', 'seal', 'inscription']],
  ['academic', ['journal', 'peer-reviewed', 'ph.d', 'university press', 'jstor', 'doi', 'professor']],
  ['science', ['radiocarbon', 'geology', 'genetics', 'cosmology', 'paleoclimate', 'isotope', 'c-14']],
  ['museum', ['collection', 'exhibit', 'accession', 'gallery', 'artifact']],
  ['history', ['chronicle', 'annals', 'antiquity', 'empire', 'dynasty', 'inscription']],
]
function scoreCredibility(domain, snippet) {
  const base = DOMAIN_CREDIBILITY[domain] ?? 0.55
  const lower = (snippet || '').toLowerCase()
  let bonus = 0
  for (const [, kws] of CATEGORY_KEYWORDS) for (const k of kws) if (lower.includes(k)) bonus = Math.max(bonus, 0.05)
  if (domain.includes('blog') || domain.includes('forum')) return Math.min(base - 0.15, 0.4)
  return Math.min(base + bonus, 0.99)
}
const tier = (c) => (c >= 0.9 ? 'peer-reviewed' : c >= 0.75 ? 'reputable-reference' : c >= 0.55 ? 'popular-journalistic' : 'self-published')
function categorize(domain, snippet) {
  const lower = (domain + ' ' + (snippet || '')).toLowerCase()
  for (const [cat, kws] of CATEGORY_KEYWORDS) if (kws.some((k) => lower.includes(k))) return cat
  if (domain.includes('museum')) return 'museum'
  if (domain.includes('nature') || domain.includes('science')) return 'science'
  return 'history'
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const FILM_QUERIES = [
  ['Harrowing of Hell Christ descent Hades 1 Peter 3:19 scholarly', 'film: harrowing of hell'],
  ['Book of Enoch Watchers Mount Hermon archaeology Dead Sea Scrolls', 'film: book of enoch'],
  ['Resurrection of Jesus Christ empty tomb historical evidence scholarly', 'film: resurrection'],
  ['Ethiopian Orthodox Tewahedo canon 81 books broader narrower', 'film: ethiopian canon'],
  ['Anne Catherine Emmerich visions Passion of the Christ', 'film: emmerich visions'],
  ['4 Baruch Paralipomena Jeremiah harrowing hell tradition', 'film: 4 baruch'],
  ['Meqabyan Ethiopian Maccabees difference Greek Maccabees', 'film: meqabyan'],
  ['Jubilees 364 day calendar Qumran Dead Sea Scrolls', 'film: jubilees calendar'],
  ['Nephilim Watchers Genesis 6 sons of God scholarly interpretation', 'film: nephilim'],
  ['Azazel scapegoat Leviticus 16 Yom Kippur demonology', 'film: azazel'],
].map(([query, label]) => ({ query, label }))

async function buildQueue() {
  const items = []
  if (MODE === 'film-topics' || MODE === 'all') items.push(...FILM_QUERIES)
  if (MODE === 'themes' || MODE === 'all') {
    const themes = await db.theme.findMany({ include: { verseLinks: { include: { verse: { include: { book: true, chapter: true } } }, take: 1 } }, take: LIMIT })
    for (const t of themes) {
      const v = t.verseLinks[0]?.verse
      items.push({
        query: `${t.name} ${(t.description || '').slice(0, 80)} biblical archaeology peer-reviewed scholarship`,
        scriptureRef: v ? `${v.book.slug} ${v.chapter.number}:${v.verseNum}` : undefined,
        scriptureText: v?.text, label: `theme: ${t.name}`,
      })
    }
  }
  if (MODE === 'verses') {
    // Verses containing key terms that lack a scholarly source → per-verse corroboration.
    const TERMS = ['Watchers', 'Nephilim', 'Azazel', 'Hermon', 'Son of Man', 'Sheol', 'Tartarus', 'giants', 'prison', 'preached', 'spirits']
    const verses = await db.verse.findMany({
      where: { OR: TERMS.map((t) => ({ text: { contains: t } })) },
      include: { book: true, chapter: true }, take: LIMIT * 2,
    })
    for (const v of verses) {
      const term = TERMS.find((t) => v.text.includes(t)) || ''
      items.push({
        query: `"${term}" ${v.book.name} ${v.chapter.number}:${v.verseNum} scholarly historical archaeological evidence peer-reviewed`,
        scriptureRef: `${v.book.slug} ${v.chapter.number}:${v.verseNum}`,
        scriptureText: v.text, label: `verse: ${v.book.slug} ${v.chapter.number}:${v.verseNum} (${term})`,
      })
    }
  }
  const seen = new Set()
  return items.filter((w) => { const k = w.query.slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true }).slice(0, LIMIT)
}

async function main() {
  if (!KEY) { console.error('no ZAI_API_KEY'); process.exit(1) }
  const queue = await buildQueue()
  console.error(`[scrape-grow] mode=${MODE} limit=${LIMIT} min-cred=${MIN_CRED}${RECENCY ? ' recency=' + RECENCY : ''}${ONLY ? ' only=' + ONLY : ''} → ${queue.length} work items (leads kept as exploratory)\n`)
  let sourcesAdded = 0, evidenceAdded = 0, skipped = 0, processed = 0, leadsAdded = 0
  for (const item of queue) {
    processed++
    let results
    try { results = await webSearch(item.query, 5) } catch (e) { console.error(`  ✗ ${item.label}: ${e.message}`); continue }
    if (!results.length) { console.error(`  · ${item.label}: no results`); skipped++; continue }
    console.error(`  ▸ ${item.label} → ${results.length} results`)
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i]
      if (!r.url) continue
      const domain = (() => { try { return new URL(r.url).hostname.replace(/^www\./, '') } catch { return 'unknown' } })()
      const snippet = r.snippet || r.name || ''
      const { credibility, tierName, isLead } = classify(domain, snippet)
      if (ONLY === 'scholarly' && isLead) { skipped++; continue }
      if (ONLY === 'lead' && !isLead) { skipped++; continue }
      if (credibility < MIN_CRED) { skipped++; continue }
      if (await db.source.findUnique({ where: { url: r.url } })) { skipped++; continue }
      let content = null, summary = snippet, title = r.name || r.url
      if (i === 0) {
        const page = await readPage(r.url)
        if (page?.text) { content = page.text; if (page.title) title = page.title; const s = page.text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' '); if (s.length > 80) summary = s }
      }
      const created = await db.source.create({
        data: { url: r.url, title, domain, category: isLead ? 'community-lead' : categorize(domain, snippet), credibilityTier: tierName, credibility, author: null, summary, content, keywords: item.label, publishedAt: null },
      })
      sourcesAdded++
      if (isLead) leadsAdded++
      console.error(`      + ${isLead ? '◇lead ' : '◆schol'} ${domain} (${(credibility * 100).toFixed(0)}%) ${r.url.slice(0, 66)}`)
      if (item.scriptureRef) {
        const reviewState = isLead ? 'draft' : 'auto-corroborated'
        const ev = await db.evidence.create({
          data: {
            sourceId: created.id, scriptureRef: item.scriptureRef, scriptureText: item.scriptureText || null,
            claim: item.scriptureText || `Theme: ${item.label}`, corroboration: summary || snippet,
            alignment: isLead ? 'neutral' : 'contextualizes', confidence: credibility * 0.7,
            notes: isLead ? `Exploratory lead via "${item.label}" — community/discussion source, NOT corroboration. Needs digging + corroboration.` : `Auto-grown via "${item.label}" (live MCP search).`,
            reviewState, blindspot: isLead || credibility < 0.6,
          },
        })
        await db.reviewRecord.create({ data: { itemType: 'evidence', itemId: ev.id, state: reviewState, reviewer: 'scrape-grow', reviewerRole: 'contributor', notes: `${isLead ? 'Lead' : 'Auto-grown'}: ${item.label}`, version: 1 } })
        await db.auditLog.create({ data: { action: 'create', itemType: 'evidence', itemId: ev.id, actor: 'scrape-grow', actorRole: 'contributor', details: JSON.stringify({ query: item.query, sourceUrl: r.url, credibility, isLead }) } })
        evidenceAdded++
      }
    }
    await sleep(1500)
  }
  const [sources, evidence, reviews, leadSources] = await Promise.all([db.source.count(), db.evidence.count(), db.reviewRecord.count(), db.source.count({ where: { credibilityTier: 'community-lead' } })])
  console.error(`\n[scrape-grow] done: processed=${processed} +sources=${sourcesAdded} (of which leads=${leadsAdded}) +evidence=${evidenceAdded} skipped=${skipped}`)
  console.error(`[scrape-grow] DB totals → sources=${sources} (community-leads=${leadSources}) evidence=${evidence} reviewRecords=${reviews}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
