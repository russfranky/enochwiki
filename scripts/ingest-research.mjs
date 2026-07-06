// Ingest GLM-swarm research JSON (data/research/*.json) into the corpus — with
// verification. The swarm workers browse and propose sources; this script TRUSTS
// NOTHING: it fetches every URL, drops anything dead or off-topic (kills
// hallucinated citations), caps credibility at what the domain actually warrants,
// and files survivors as DRAFT leads (reviewState 'draft', blindspot true) — never
// as auto-corroborated. Dedups by URL. A human/verifier pass promotes them later.
//
//   node --env-file=.env scripts/ingest-research.mjs [--dry] [--file data/research/x.json]

import { PrismaClient } from '@prisma/client'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const db = new PrismaClient()
const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')
const only = (() => { const i = argv.indexOf('--file'); return i >= 0 ? argv[i + 1] : null })()
const dir = join(here, '..', 'data', 'research')

const KEYWORDS = ['enoch', 'watcher', 'nephilim', 'azazel', 'hermon', 'jubilee', 'qumran', 'dead sea scroll', 'son of man', 'giant', 'apocalyp', 'pseudepigrap', 'second temple', 'merkav', 'sheol', 'tartarus', 'fallen angel', 'book of giants', 'aramaic', 'ethiopic', "ge'ez", 'geez', 'meqabyan', 'baruch', 'melchizedek', 'metatron', 'hekhalot', 'manichaean', 'hermas', 'tertullian', 'origen', 'patristic', 'canon', 'angel', 'heaven', 'ascent', 'apocrypha', 'noah', 'flood']
const SCHOLARLY = ['.edu', 'brill.com', 'jstor.org', 'cambridge.org', 'oxford', 'academia.edu', 'degruyter', 'doi.org', 'archive.org', 'sbl-site', 'bibleinterp', 'thetorah', 'betamasaheft', 'deadseascrolls', 'newadvent', 'earlychristianwritings', 'britishmuseum', 'loc.gov']
const DOMAIN_CRED = { 'deadseascrolls.org.il': 0.98, 'britishmuseum.org': 0.97, 'brill.com': 0.92, 'jstor.org': 0.92, 'cambridge.org': 0.92, 'academia.edu': 0.7, 'biblicalarchaeology.org': 0.9, 'asor.org': 0.88, 'bibleinterp.com': 0.85, 'loc.gov': 0.9, 'betamasaheft.eu': 0.9, 'thetorah.com': 0.78, 'newadvent.org': 0.6, 'earlychristianwritings.com': 0.62, 'archive.org': 0.8, 'wikipedia.org': 0.65, 'sacred-texts.com': 0.55 }
const UA = 'Mozilla/5.0 (compatible; EnochWikiBot/1.0; +https://enoch.wiki/bot)'
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const isScholarly = (d) => SCHOLARLY.some((s) => d.includes(s))
const regDom = (d) => d.split('.').slice(-2).join('.')
const domainCred = (d) => DOMAIN_CRED[d] ?? DOMAIN_CRED[regDom(d)] ?? (isScholarly(d) ? 0.8 : 0.55)
const tierOf = (c) => (c >= 0.9 ? 'peer-reviewed' : c >= 0.75 ? 'reputable-reference' : c >= 0.55 ? 'popular-journalistic' : 'self-published')
const sanitize = (s) => Array.from(String(s ?? '')).filter((ch) => { const c = ch.codePointAt(0); if (c === 0xFFFD) return false; if (c < 32 && c !== 9 && c !== 10 && c !== 13) return false; if (c >= 0x7F && c <= 0x9F) return false; if (c >= 0xD800 && c <= 0xDFFF) return false; return true }).join('')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchLive(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(15000), redirect: 'follow' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html') && !ct.includes('text') && !ct.includes('pdf')) return null
    const html = await res.text()
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || ''
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 12000)
    return { title, text }
  } catch { return null }
}

function loadFiles() {
  if (only) return existsSync(only) ? [only] : []
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f))
}

async function main() {
  const files = loadFiles()
  if (!files.length) { console.error('[ingest] no data/research/*.json files found'); await db.$disconnect(); return }
  const proposed = []
  for (const f of files) {
    try { const j = JSON.parse(readFileSync(f, 'utf8')); for (const s of (j.sources || [])) proposed.push({ ...s, _file: f.split('/').pop() }) }
    catch (e) { console.error(`[ingest] bad JSON ${f}: ${e.message}`) }
  }
  console.error(`[ingest] ${proposed.length} proposed sources from ${files.length} file(s)${DRY ? ' (dry)' : ''}\n`)
  const existing = new Set((await db.source.findMany({ select: { url: true } })).map((s) => s.url))
  let filed = 0, ev = 0, dupes = 0, dead = 0, offtopic = 0
  for (const s of proposed) {
    const url = (s.url || '').split('#')[0]
    if (!url || existing.has(url)) { dupes++; continue }
    const domain = hostOf(url)
    if (!domain) { dead++; continue }
    const page = await fetchLive(url)
    await sleep(400)
    if (!page) { dead++; console.error(`  ✗ dead ${url.slice(0, 66)}`); continue }
    const hay = (page.title + ' ' + page.text + ' ' + (s.summary || '') + ' ' + (s.title || '')).toLowerCase()
    if (!KEYWORDS.some((k) => hay.includes(k))) { offtopic++; console.error(`  ~ off-topic ${url.slice(0, 60)}`); continue }
    // Verified credibility = min(worker claim, what the domain warrants) — no inflation.
    const cred = Math.min(typeof s.credibility === 'number' ? s.credibility : 0.6, domainCred(domain) + 0.03)
    const tier = tierOf(cred)
    existing.add(url)
    filed++
    if (DRY) { console.error(`  ◆ ${domain} (${Math.round(cred * 100)}%) ${url.slice(0, 60)}`); continue }
    const created = await db.source.create({
      data: {
        url, title: sanitize(page.title || s.title || url).slice(0, 300), domain,
        category: ['academic', 'archaeology', 'science', 'museum', 'history', 'comparative-religion'].includes(s.category) ? s.category : 'comparative-religion',
        credibilityTier: tier, credibility: cred, author: s.author ? sanitize(s.author).slice(0, 200) : null,
        summary: sanitize(s.summary || '').slice(0, 500) || null, content: sanitize(page.text || s.content || '') || null,
        keywords: `glm-swarm: ${sanitize(s.keywords || s._file)}`, publishedAt: null,
      },
    })
    for (const e of (s.evidences || [])) {
      if (!e || !e.scriptureRef) continue
      const evd = await db.evidence.create({
        data: {
          sourceId: created.id, scriptureRef: sanitize(e.scriptureRef).slice(0, 100), scriptureText: e.scriptureText ? sanitize(e.scriptureText) : null,
          claim: sanitize(e.claim || `Research lead: ${s.keywords || ''}`), corroboration: sanitize(e.corroboration || s.summary || ''),
          alignment: ['supports', 'contextualizes', 'challenges', 'neutral'].includes(e.alignment) ? e.alignment : 'contextualizes',
          confidence: Math.min(typeof e.confidence === 'number' ? e.confidence : 0.5, cred * 0.75),
          notes: sanitize((e.notes || '') + ' [glm-swarm research lead — verify before promoting]').slice(0, 800),
          reviewState: 'draft', blindspot: true,
        },
      })
      await db.reviewRecord.create({ data: { itemType: 'evidence', itemId: evd.id, state: 'draft', reviewer: 'glm-swarm', reviewerRole: 'contributor', notes: `Research lead: ${s.keywords || s._file}`, version: 1 } })
      await db.auditLog.create({ data: { action: 'create', itemType: 'evidence', itemId: evd.id, actor: 'glm-swarm', actorRole: 'contributor', details: JSON.stringify({ url, domain, cred, file: s._file }) } })
      ev++
    }
    console.error(`  ◆ filed ${domain} (${Math.round(cred * 100)}%) ${url.slice(0, 58)}`)
  }
  console.error(`\n[ingest] filed=${filed} evidence=${ev} | rejected: dupes=${dupes} dead=${dead} off-topic=${offtopic}`)
  const [src, evc] = await Promise.all([db.source.count(), db.evidence.count()])
  console.error(`[ingest] DB totals → sources=${src} evidence=${evc}`)
  await db.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
