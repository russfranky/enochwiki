// Recursive, relevance-gated crawler — dig deeper by following the links and
// citations *out* of pages we already trust, on-topic, to a bounded depth.
// Complements scrape-grow.mjs (which discovers via search): this deepens by
// traversal. Stays on the corpus via a keyword/scholarly-domain gate so it never
// explodes into the open web. Politeness: robots.txt (best-effort), per-domain
// caps, and a delay between fetches. No z.ai key needed (HTTP only) unless seeding
// from a fresh search.
//
//   node --env-file=.env scripts/crawl.mjs --seed-db            [--depth 2] [--max-pages 40]
//   node --env-file=.env scripts/crawl.mjs --seed-search "Book of Giants Qumran"
//   node --env-file=.env scripts/crawl.mjs --url https://… --topic "theme: X" --ref "1-enoch 7:2"
//
//   --depth N (default 2)  --max-pages N (default 40)  --per-domain N (default 4)
//   --breadth N (links followed per page, default 6)   --no-leads (don't save community pages)

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const db = new PrismaClient()

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d }
const flag = (f) => argv.includes(f)
const DEPTH = parseInt(opt('--depth', '2'), 10)
const MAX_PAGES = parseInt(opt('--max-pages', '40'), 10)
const PER_DOMAIN = parseInt(opt('--per-domain', '4'), 10)
const BREADTH = parseInt(opt('--breadth', '6'), 10)
const NO_LEADS = flag('--no-leads')
const UA = 'Mozilla/5.0 (compatible; EnochWikiBot/1.0; +https://enoch.wiki/bot)'

// ── relevance gate: corpus keywords keep the crawl on-topic ──────────────────
const KEYWORDS = ['enoch', 'watcher', 'nephilim', 'azazel', 'hermon', 'jubilee', 'qumran', 'dead sea scroll', 'son of man', 'giant', 'apocalyp', 'pseudepigrap', 'second temple', 'merkav', 'sheol', 'tartarus', 'fallen angel', 'book of giants', 'aramaic', 'ethiopic', "ge'ez", 'geez', 'meqabyan', 'baruch', 'emmerich', 'harrowing', 'resurrection', 'scapegoat', 'leviticus', 'genesis 6', 'noah', 'flood', 'cherub', 'seraph', 'apocrypha', 'deuterocanon', 'tewahedo', 'nicke', 'stuckenbruck', 'charlesworth']
// Domains worth following even when anchor text is terse (scholarly hubs).
const SCHOLARLY = ['.edu', 'brill.com', 'jstor.org', 'cambridge.org', 'oxford', 'academia.edu', 'deadseascrolls', 'biblicalarchaeology', 'asor.org', 'nature.com', 'science.org', 'sciencedirect', 'britishmuseum', 'loc.gov', 'sbl-site', 'degruyter', 'bibleinterp', 'thetorah', 'israelantiquities', 'doi.org', 'archive.org']
const COMMUNITY = ['facebook.com', 'reddit.com', 'quora.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'tiktok.com', 'instagram.com', 'pinterest.com', 'threads.net', 'linkedin.com', 'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com']
// Never crawl these — infrastructure / off-topic.
const HARD_SKIP = ['google.', 'gstatic', 'googletagmanager', 'doubleclick', 'cloudflare', 'cdn.', 'fonts.', 'accounts.', 'login.', 'auth.', 'signin', 'apple.com', 'microsoft.com', 'bing.com', 'amazon.', 'ebay.', 'paypal', 'cookiepedia', 'addthis', 'sharethis', 'gravatar', 'wp-content', 'wp-json']
const ASSET = /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|json|woff2?|ttf|eot|mp4|mp3|wav|zip|gz|rss)(\?|$)/i
// Boilerplate paths — never content: bare origins, share/auth/account/listing endpoints.
const SKIP_PATH = /sharer|\/share(\b|r|\/)|\/intent\/|\/login|\/sign-?in|\/sign-?up|\/register|\/account|\/subscribe|\/donate|\/cart|\/checkout|\/feed\b|\/rss|\/wp-(admin|login|json)|\/search\b|\/tag\/|\/category\/|\/author\/|\/auth\/|\/issue\/|\/issues\/|\/department\/|\/cdn-cgi\//i
function skipUrl(u) {
  try {
    const x = new URL(u)
    if (x.pathname === '/' || x.pathname === '') return true
    if (SKIP_PATH.test(u)) return true
    if (/^(auth|login|accounts|signin|secure|my)\./.test(x.hostname)) return true
    // Wiki meta namespaces (not article content).
    if (/\/(Talk|User|Wikipedia|Help|Category|Special|File|Portal|Template|Draft|MediaWiki|Module):/.test(x.pathname)) return true
    return false
  } catch { return true }
}
const segDepth = (u) => { try { return new URL(u).pathname.replace(/\/+$/, '').split('/').filter(Boolean).length } catch { return 0 } }

const isCommunity = (d) => COMMUNITY.some((c) => d === c || d.endsWith('.' + c))
// Redundant non-English Wikimedia editions of the same article.
const otherLangWiki = (d) => /^[a-z]{2,3}\.(wikipedia|wikisource|wiktionary)\.org$/.test(d) && !/^(en|simple)\./.test(d)
// Wikimedia sister projects that aren't primary sources (keep wikisource — primary texts).
const wikimediaJunk = (d) => /(^|\.)(wikiquote|wikidata|wiktionary|wikibooks|wikiversity|wikinews|wikivoyage)\.org$/.test(d) || d === 'commons.wikimedia.org' || d === 'meta.wikimedia.org'
const regDom = (d) => d.split('.').slice(-2).join('.')
const isScholarly = (d) => SCHOLARLY.some((s) => d.includes(s))
const hardSkip = (d) => HARD_SKIP.some((s) => d.includes(s))
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function relevant(url, text) {
  const hay = (url + ' ' + (text || '')).toLowerCase()
  if (KEYWORDS.some((k) => hay.includes(k))) return true
  if (isScholarly(hostOf(url))) return true
  return false
}

// ── credibility (compact mirror of scrape-grow) ──────────────────────────────
const DOMAIN_CRED = { 'deadseascrolls.org.il': 0.98, 'britishmuseum.org': 0.97, 'brill.com': 0.95, 'nature.com': 0.95, 'science.org': 0.95, 'sciencedirect.com': 0.9, 'jstor.org': 0.92, 'cambridge.org': 0.92, 'oxfordacademic.com': 0.92, 'academia.edu': 0.7, 'biblicalarchaeology.org': 0.9, 'asor.org': 0.88, 'bibleinterp.com': 0.85, 'loc.gov': 0.9, 'israelantiquities.org': 0.92, 'thetorah.com': 0.78, 'archive.org': 0.8, 'wikipedia.org': 0.65 }
function classify(domain) {
  if (isCommunity(domain)) return { credibility: 0.4, tier: 'community-lead', isLead: true }
  let c = DOMAIN_CRED[domain] ?? (isScholarly(domain) ? 0.8 : 0.55)
  if (domain.includes('blog') || domain.includes('forum')) c = Math.min(c - 0.15, 0.4)
  const isLead = c < 0.55
  const tier = isLead ? 'self-published' : c >= 0.9 ? 'peer-reviewed' : c >= 0.75 ? 'reputable-reference' : 'popular-journalistic'
  return { credibility: c, tier, isLead }
}

// ── robots.txt (best-effort, cached per origin) ──────────────────────────────
const robotsCache = new Map()
async function allowed(url) {
  let origin, path
  try { const u = new URL(url); origin = u.origin; path = u.pathname } catch { return false }
  if (!robotsCache.has(origin)) {
    let disallow = []
    try {
      const res = await fetch(origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const txt = await res.text()
        let active = false
        for (const line of txt.split('\n')) {
          const l = line.trim().toLowerCase()
          if (l.startsWith('user-agent:')) active = l.includes('*') || l.includes('enochwiki')
          else if (active && l.startsWith('disallow:')) { const p = line.split(':')[1]?.trim(); if (p) disallow.push(p) }
          else if (l === '') active = false
        }
      }
    } catch { /* no robots → allow */ }
    robotsCache.set(origin, disallow)
  }
  return !robotsCache.get(origin).some((p) => p !== '/' && path.startsWith(p))
}

// ── fetch + extract ──────────────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(15000), redirect: 'follow' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html')) return null
    const html = await res.text()
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || url
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 12000)
    return { html, title, text, finalUrl: res.url || url }
  } catch { return null }
}
function extractLinks(html, base) {
  const out = []
  const re = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html)) && out.length < 1200) {
    let href = m[1]
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    try { href = new URL(href, base).toString() } catch { continue }
    if (!/^https?:/i.test(href) || ASSET.test(href)) continue
    out.push({ url: href.split('#')[0], text })
  }
  return out
}

// ── persistence ──────────────────────────────────────────────────────────────
const existing = new Set((await db.source.findMany({ select: { url: true } })).map((s) => s.url))
async function saveSource(url, title, content, snippet, ctx, depth) {
  if (existing.has(url)) return null
  const domain = hostOf(url)
  const { credibility, tier, isLead } = classify(domain)
  if (isLead && NO_LEADS) return null
  const created = await db.source.create({
    data: { url, title: title?.slice(0, 300) || url, domain, category: isLead ? 'community-lead' : 'crawled', credibilityTier: tier, credibility, summary: snippet?.slice(0, 500) || null, content: content || null, keywords: `crawl(d${depth}): ${ctx?.topic || 'open'}`, publishedAt: null },
  })
  existing.add(url)
  if (ctx?.ref) {
    const reviewState = isLead ? 'draft' : 'auto-corroborated'
    const ev = await db.evidence.create({ data: { sourceId: created.id, scriptureRef: ctx.ref, scriptureText: ctx.text || null, claim: ctx.text || `Crawled for ${ctx.topic}`, corroboration: snippet || title || '', alignment: isLead ? 'neutral' : 'contextualizes', confidence: credibility * 0.6, notes: `Recursive crawl (depth ${depth}) from ${ctx.topic}. ${isLead ? 'Community lead — corroborate.' : ''}`, reviewState, blindspot: isLead || credibility < 0.6 } })
    await db.reviewRecord.create({ data: { itemType: 'evidence', itemId: ev.id, state: reviewState, reviewer: 'crawl', reviewerRole: 'contributor', notes: `Crawl d${depth}: ${ctx.topic}`, version: 1 } })
    await db.auditLog.create({ data: { action: 'create', itemType: 'evidence', itemId: ev.id, actor: 'crawl', actorRole: 'contributor', details: JSON.stringify({ url, depth, credibility, isLead }) } })
  }
  return { created, isLead, credibility, domain }
}

// Citation-rich hubs: topic articles + primary-text indexes whose reference
// sections point outward to scholarly sources and primary texts. Best ROI for
// recursive crawling. Each carries topic + scripture context for inheritance.
const HUBS = [
  ['https://en.wikipedia.org/wiki/Book_of_Enoch', 'theme: book of enoch', '1-enoch 1:1'],
  ['https://en.wikipedia.org/wiki/Watcher_(angel)', 'theme: watchers', '1-enoch 6:6'],
  ['https://en.wikipedia.org/wiki/Nephilim', 'theme: nephilim', '1-enoch 7:2'],
  ['https://en.wikipedia.org/wiki/Azazel', 'theme: azazel', '1-enoch 8:1'],
  ['https://en.wikipedia.org/wiki/Mount_Hermon', 'theme: hermon', '1-enoch 6:6'],
  ['https://en.wikipedia.org/wiki/Book_of_Jubilees', 'theme: jubilees', 'jubilees 5:1'],
  ['https://en.wikipedia.org/wiki/Son_of_Man', 'theme: son of man', '1-enoch 46:2'],
  ['https://en.wikipedia.org/wiki/Dead_Sea_Scrolls', 'theme: qumran', '1-enoch 1:1'],
  ['https://en.wikipedia.org/wiki/Book_of_Giants', 'theme: giants', '1-enoch 7:2'],
  ['https://en.wikipedia.org/wiki/Sons_of_God', 'theme: nephilim', 'genesis 6:2'],
  ['https://en.wikipedia.org/wiki/Harrowing_of_Hell', 'theme: harrowing', '1-peter 3:19'],
  ['https://en.wikipedia.org/wiki/Sheol', 'theme: sheol', '1-enoch 22:3'],
  ['https://en.wikipedia.org/wiki/2_Enoch', 'theme: enoch ascension', '1-enoch 71:9'],
  ['https://en.wikipedia.org/wiki/Apocalypse_of_Weeks', 'theme: eschatology', '1-enoch 1:1'],
  ['https://en.wikipedia.org/wiki/Anne_Catherine_Emmerich', 'theme: emmerich', null],
  ['https://en.wikipedia.org/wiki/Orthodox_Tewahedo_biblical_canon', 'theme: ethiopian canon', null],
  ['https://www.sacred-texts.com/bib/boe/index.htm', 'theme: book of enoch', '1-enoch 1:1'],
  ['https://www.earlyjewishwritings.com/1enoch.html', 'theme: book of enoch', '1-enoch 1:1'],
]

// ── seeds ────────────────────────────────────────────────────────────────────
async function buildSeeds() {
  const seeds = []
  if (flag('--seed-hubs')) for (const [url, topic, ref] of HUBS) seeds.push({ url, depth: 0, ctx: { topic, ref } })
  if (flag('--url')) {
    seeds.push({ url: opt('--url'), depth: 0, ctx: { topic: opt('--topic', 'manual'), ref: opt('--ref', null) } })
  }
  if (flag('--seed-db')) {
    // Crawl outward from the scholarly sources we already trust (they cite more).
    const top = await db.source.findMany({ where: { credibility: { gte: 0.8 }, content: { not: null } }, take: 25, orderBy: { credibility: 'desc' } })
    for (const s of top) {
      const ev = await db.evidence.findFirst({ where: { sourceId: s.id }, select: { scriptureRef: true, scriptureText: true } })
      seeds.push({ url: s.url, depth: 0, ctx: { topic: s.keywords || 'db', ref: ev?.scriptureRef || null, text: ev?.scriptureText || null }, _haveContent: true })
    }
  }
  if (flag('--seed-search')) {
    const q = opt('--seed-search')
    const KEY = process.env.ZAI_API_KEY || (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim() } catch { return '' } })()
    const MCP = process.env.ZAI_MCP_WEB_SEARCH_URL || 'https://api.z.ai/api/mcp/web_search_prime/mcp'
    const rpc = async (method, params, sid, id = 1) => { const r = await fetch(MCP, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sid ? { 'Mcp-Session-Id': sid } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }); const t = await r.text(); let j = null; for (let ln of t.split('\n')) { ln = ln.trim(); if (ln.startsWith('data:')) ln = ln.slice(5).trim(); if (ln.startsWith('{')) { try { j = JSON.parse(ln); break } catch { /**/ } } } return { sid: r.headers.get('mcp-session-id'), j } }
    const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'enochwiki', version: '1' } })
    const { j } = await rpc('tools/call', { name: 'web_search_prime', arguments: { search_query: q } }, init.sid, 3)
    let parsed = j?.result?.content?.[0]?.text ?? ''
    for (let i = 0; i < 2; i++) if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { break } }
    for (const r of (Array.isArray(parsed) ? parsed : []).slice(0, 5)) seeds.push({ url: r.link || r.url, depth: 0, ctx: { topic: `search: ${q}`, ref: null } })
  }
  return seeds
}

// ── BFS crawl ────────────────────────────────────────────────────────────────
const seeds = await buildSeeds()
if (!seeds.length) { console.error('no seeds — pass --seed-db, --seed-search "q", or --url URL'); await db.$disconnect(); process.exit(2) }
console.error(`[crawl] depth=${DEPTH} max-pages=${MAX_PAGES} per-domain=${PER_DOMAIN} breadth=${BREADTH} | ${seeds.length} seeds\n`)

const frontier = [...seeds]
const visited = new Set()
const perDomain = {}
let pages = 0, saved = 0, leads = 0, lastFetch = 0

while (frontier.length && pages < MAX_PAGES) {
  const node = frontier.shift()
  const url = node.url?.split('#')[0]
  if (!url || visited.has(url)) continue
  visited.add(url)
  const domain = hostOf(url)
  if (!domain || hardSkip(domain)) continue
  perDomain[domain] = (perDomain[domain] || 0)
  if (perDomain[domain] >= PER_DOMAIN) continue
  // Skip community footer links and boilerplate paths (search handles real leads).
  if (isCommunity(domain) || skipUrl(url)) continue
  if (!(await allowed(url))) { continue }

  // politeness
  const wait = 1200 - (Date.now() - lastFetch)
  if (wait > 0) await sleep(wait)
  lastFetch = Date.now()

  const page = await fetchPage(url)
  pages++
  perDomain[domain]++
  if (!page) continue

  // Save only real, on-topic content pages (≥2 path segments, substantial text,
  // and a corpus keyword present in the text); nav/listing pages are still
  // traversed for their links but not filed as sources.
  const onTopic = KEYWORDS.some((k) => (page.title + ' ' + page.text).toLowerCase().includes(k))
  if (!node._haveContent && onTopic && segDepth(page.finalUrl) >= 2 && page.text.length > 500 && !skipUrl(page.finalUrl)) {
    const snippet = page.text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ')
    const r = await saveSource(page.finalUrl, page.title, page.text, snippet, node.ctx, node.depth)
    if (r) { saved++; if (r.isLead) leads++; console.error(`  ${r.isLead ? '◇' : '◆'} d${node.depth} ${r.isLead ? 'lead ' : 'src  '} ${r.domain} (${Math.round(r.credibility * 100)}%) ${url.slice(0, 58)}`) }
  }

  // Recurse: follow the most relevant outbound links. Prefer cross-site links
  // (the citations/references that reach NEW sources), scholarly domains first;
  // internal nav links fill in only if there's breadth left.
  if (node.depth < DEPTH) {
    const cur = regDom(domain)
    const links = extractLinks(page.html, page.finalUrl)
      .filter((l) => { const d = hostOf(l.url); return d && !hardSkip(d) && !isCommunity(d) && !otherLangWiki(d) && !wikimediaJunk(d) && !skipUrl(l.url) && !visited.has(l.url) && !existing.has(l.url) && relevant(l.url, l.text) })
    const score = (l) => { const d = hostOf(l.url); return (regDom(d) !== cur ? 2 : 0) + (isScholarly(d) ? 1 : 0) }
    links.sort((a, b) => score(b) - score(a))
    const seen = new Set()
    const picked = []
    for (const l of links) { const d = hostOf(l.url); if (seen.has(l.url)) continue; seen.add(l.url); if ((perDomain[d] || 0) < PER_DOMAIN) picked.push(l); if (picked.length >= BREADTH) break }
    for (const l of picked) frontier.push({ url: l.url, text: l.text, depth: node.depth + 1, ctx: node.ctx })
  }
}

console.error(`\n[crawl] done: fetched ${pages} pages, +${saved} sources (${leads} leads), frontier left ${frontier.length}`)
const [src, ev] = await Promise.all([db.source.count(), db.evidence.count()])
console.error(`[crawl] DB totals → sources=${src} evidence=${ev}`)
await db.$disconnect()
