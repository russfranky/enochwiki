// Validate the PEOPLE & INSTITUTIONS behind the evidence — a second axis of
// verifiability alongside source credibility. Two passes:
//
//   1. Institutional authorities (deterministic): every source's domain maps to
//      the body that stands behind it (British Museum, Brill, a university...),
//      scored by institutional standing and linked role=institution/publisher.
//   2. Named scholars (web-validated the SAME way we validate sources): for a
//      curated set of figures underpinning this corpus, run an independent web
//      search to corroborate credentials/affiliation, score, and link role=author
//      to any source whose text names them.
//
//   node --env-file=.env scripts/validate-authorities.mjs
//
// Writes data/authorities-export.json (durable). Idempotent (upsert by slug).

import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const db = new PrismaClient()
// --offline: restore validated scholar scores from the export instead of
// re-running web validation (used by the bootstrap; links are always re-derived
// deterministically because source ids change on every reseed).
const OFFLINE = process.argv.includes('--offline')
let RESTORED = {}
try { for (const a of JSON.parse(readFileSync('data/authorities-export.json', 'utf8')).authorities) RESTORED[a.slug] = a } catch { /* no prior export */ }
const KEY = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY ||
  (() => { try { return readFileSync(join(homedir(), '.config/glm/z-ai.key'), 'utf8').trim() } catch { return '' } })()
const MCP_URL = process.env.ZAI_MCP_WEB_SEARCH_URL || 'https://api.z.ai/api/mcp/web_search_prime/mcp'
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const tierFor = (c) => (c >= 0.9 ? 'established-authority' : c >= 0.75 ? 'credentialed' : c >= 0.55 ? 'recognized' : 'unverified-claimant')

// ── MCP web search (mirror) ──────────────────────────────────────────────────
async function mcpRpc(method, params, sid, id = 1) {
  const res = await fetch(MCP_URL, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sid ? { 'Mcp-Session-Id': sid } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) })
  const text = await res.text()
  if (!res.ok) throw new Error(`MCP ${method} ${res.status}`)
  let json = null
  for (let line of text.split('\n')) { line = line.trim(); if (line.startsWith('data:')) line = line.slice(5).trim(); if (line.startsWith('{')) { try { json = JSON.parse(line); break } catch { /**/ } } }
  return { sid: res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id'), json }
}
async function webSearch(query) {
  const init = await mcpRpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'enochwiki', version: '1' } })
  const { json } = await mcpRpc('tools/call', { name: 'web_search_prime', arguments: { search_query: query } }, init.sid, 3)
  let parsed = json?.result?.content?.[0]?.text ?? ''
  for (let i = 0; i < 2; i++) if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { break } }
  return Array.isArray(parsed) ? parsed.filter((r) => r && (r.link || r.url)) : []
}

// ── Pass 1: institutional authorities by domain ──────────────────────────────
const INSTITUTIONS = {
  'deadseascrolls.org.il': ['Israel Antiquities Authority — Dead Sea Scrolls', 'museum', 0.97, 'secular-academic'],
  'israelantiquities.org': ['Israel Antiquities Authority', 'museum', 0.95, 'secular-academic'],
  'britishmuseum.org': ['The British Museum', 'museum', 0.96, 'secular-academic'],
  'metmuseum.org': ['The Metropolitan Museum of Art', 'museum', 0.95, 'secular-academic'],
  'louvre.fr': ['Musée du Louvre', 'museum', 0.95, 'secular-academic'],
  'loc.gov': ['Library of Congress', 'institution', 0.92, 'secular-academic'],
  'brill.com': ['Brill Academic Publishers', 'publisher', 0.95, 'secular-academic'],
  'jstor.org': ['JSTOR', 'publisher', 0.9, 'secular-academic'],
  'cambridge.org': ['Cambridge University Press', 'publisher', 0.93, 'secular-academic'],
  'oxfordacademic.com': ['Oxford University Press', 'publisher', 0.93, 'secular-academic'],
  'nature.com': ['Nature (Springer Nature)', 'publisher', 0.95, 'secular-academic'],
  'science.org': ['Science (AAAS)', 'publisher', 0.95, 'secular-academic'],
  'sciencedirect.com': ['Elsevier — ScienceDirect', 'publisher', 0.9, 'secular-academic'],
  'biblicalarchaeology.org': ['Biblical Archaeology Society', 'institution', 0.9, 'mainstream-christian'],
  'asor.org': ['American Society of Overseas Research', 'institution', 0.9, 'secular-academic'],
  'bibleinterp.com': ['Bible and Interpretation', 'institution', 0.82, 'secular-academic'],
  'academia.edu': ['Academia.edu (open repository)', 'institution', 0.62, 'secular-academic'],
  'wikipedia.org': ['Wikipedia (tertiary reference)', 'institution', 0.6, 'secular-academic'],
  'intertextual.bible': ['The Intertextual Bible Project', 'institution', 0.7, 'secular-academic'],
  'thetorah.com': ['Project TABS — TheTorah.com', 'institution', 0.78, 'jewish'],
  'thegospelcoalition.org': ['The Gospel Coalition', 'institution', 0.6, 'protestant'],
}
function institutionFor(domain) {
  if (INSTITUTIONS[domain]) return INSTITUTIONS[domain]
  if (domain.endsWith('.edu') || domain.includes('.edu') || /eprints|digitalcommons|scholarworks|etd\.|ohiolink/.test(domain)) return [`${domain} (academic repository)`, 'university', 0.8, 'secular-academic']
  return null
}

const COMMUNITY = ['facebook.com', 'reddit.com', 'quora.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'tiktok.com', 'instagram.com', 'pinterest.com', 'threads.net', 'linkedin.com', 'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com', 'tumblr.com']

async function upsertAuthority(data) {
  return db.authority.upsert({ where: { slug: data.slug }, update: data, create: data })
}
async function link(sourceId, authorityId, role) {
  const exists = await db.sourceAuthority.findFirst({ where: { sourceId, authorityId, role } })
  if (!exists) await db.sourceAuthority.create({ data: { sourceId, authorityId, role } })
}

const sources = await db.source.findMany()
let instCount = 0, instLinks = 0
const seenInst = new Set()
for (const s of sources) {
  const dom = s.domain
  let inst = institutionFor(dom)
  if (!inst && COMMUNITY.some((c) => dom === c || dom.endsWith('.' + c))) {
    inst = [`${dom} (community platform)`, 'community', 0.35, 'fringe-speculative']
  }
  if (!inst) inst = [`${dom}`, 'institution', Math.min(s.credibility, 0.7), null]
  const [name, type, cred, persp] = inst
  const slug = slugify(name)
  const a = await upsertAuthority({
    slug, name, kind: 'institution', type, credibility: cred, credibilityTier: tierFor(cred),
    verificationBasis: 'institutional', perspectiveSlug: persp,
    validationNotes: `Publisher/host of ${dom}. Institutional standing.`, homepage: `https://${dom}`,
  })
  if (!seenInst.has(slug)) { seenInst.add(slug); instCount++ }
  await link(s.id, a.id, type === 'publisher' ? 'publisher' : 'institution')
  instLinks++
}
console.error(`[authorities] institutions: ${instCount} distinct, ${instLinks} source links`)

// ── Pass 2: named scholars, independently web-validated ──────────────────────
const SCHOLARS = [
  ['R. H. Charles', 'scholar', 'apocryphal', 'Oxford translator of 1 Enoch & OT Pseudepigrapha'],
  ['George W. E. Nickelsburg', 'scholar', 'secular-academic', '1 Enoch Hermeneia commentary'],
  ['James H. Charlesworth', 'scholar', 'mainstream-christian', 'OT Pseudepigrapha, Princeton'],
  ['Loren T. Stuckenbruck', 'scholar', 'secular-academic', '1 Enoch, Book of Giants'],
  ['Annette Yoshiko Reed', 'scholar', 'secular-academic', 'Fallen Angels / Enochic traditions'],
  ['John J. Collins', 'scholar', 'secular-academic', 'Apocalypticism, Yale'],
  ['Michael E. Stone', 'scholar', 'secular-academic', 'Armenian & Enochic studies'],
  ['Jacob Milgrom', 'scholar', 'jewish', 'Leviticus / Azazel scapegoat ritual'],
  ['Devorah Dimant', 'scholar', 'secular-academic', 'Qumran & Pseudepigrapha'],
  ['Florentino García Martínez', 'scholar', 'secular-academic', 'Dead Sea Scrolls'],
  ['Anne Catherine Emmerich', 'visionary', 'mystical-visionary', 'Augustinian mystic, recorded visions'],
]
const STRONG = ['.edu', 'wikipedia.org', 'brill.com', 'jstor.org', 'academia.edu', 'cambridge.org', 'oxford', 'degruyter', 'sbl-site', 'britannica.com', 'yale.', 'princeton.', 'harvard.']
let scholarCount = 0, scholarLinks = 0
for (const [name, type, persp, field] of SCHOLARS) {
  const slug = slugify(name)
  let credibility, basis, notes, homepage
  const cached = RESTORED[slug]
  if (OFFLINE && cached) {
    credibility = cached.credibility; basis = cached.verificationBasis; notes = cached.validationNotes; homepage = cached.homepage
  } else {
    let results = []
    try { results = await webSearch(`${name} ${type === 'visionary' ? 'mystic visions biography' : 'biblical scholar credentials university affiliation'}`) } catch { /* offline / no key */ }
    const strong = results.filter((r) => STRONG.some((d) => (r.link || r.url || '').includes(d))).length
    if (type === 'visionary') { credibility = 0.55; basis = 'credentials-verified' } // documented historical figure, but private revelation
    else if (strong >= 2) { credibility = 0.92; basis = 'peer-cited' }
    else if (strong === 1) { credibility = 0.8; basis = 'credentials-verified' }
    else { credibility = 0.6; basis = results.length ? 'self-claimed' : 'unverified' }
    const top = results[0]
    notes = `Independent web check: ${strong} strong academic/reference hits${top ? `; e.g. ${top.title?.slice(0, 80)} (${(top.link || top.url || '').slice(0, 60)})` : ''}.`
    homepage = top?.link || top?.url || null
  }
  const a = await upsertAuthority({
    slug, name, kind: 'person', type, field,
    credibility, credibilityTier: tierFor(credibility), verificationBasis: basis, perspectiveSlug: persp,
    validationNotes: notes, homepage,
  })
  scholarCount++
  // Link to sources whose text names this scholar (surname match).
  const surname = name.split(' ').pop()
  const matches = await db.source.findMany({ where: { OR: [{ content: { contains: surname } }, { title: { contains: surname } }, { author: { contains: surname } }] }, select: { id: true } })
  for (const m of matches) { await link(m.id, a.id, 'author'); scholarLinks++ }
  console.error(`  ◆ ${name} → ${(credibility * 100).toFixed(0)}% ${tierFor(credibility)} (${basis})${OFFLINE && cached ? ' [restored]' : ''}; ${matches.length} sources`)
  if (!OFFLINE) await new Promise((r) => setTimeout(r, 1200))
}
console.error(`[authorities] scholars: ${scholarCount} validated, ${scholarLinks} source links`)

// ── Durable export (online validation only; offline preserves the snapshot) ───
if (!OFFLINE) {
  const all = await db.authority.findMany({ include: { sourceLinks: true } })
  writeFileSync('data/authorities-export.json', JSON.stringify({ exportedAt: new Date().toISOString(), count: all.length, authorities: all }, null, 2))
  console.error(`[authorities] exported ${all.length} authorities → data/authorities-export.json`)
}
await db.$disconnect()
