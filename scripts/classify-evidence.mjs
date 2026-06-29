// File every Evidence row at its honest level of verifiability by assigning a
// ClaimType slug, derived from the backing Source (domain → category → tier).
// This is the "different levels of verifiability" spine: nothing is asserted as
// truth, everything is filed where it belongs so readers can weigh it.
//
//   node --env-file=.env scripts/classify-evidence.mjs
//
// Idempotent: re-running re-derives the claim type for every row. Heuristics are
// deliberately conservative — the editorial gate refines from here.

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// Verifiability ladder (highest → lowest). Domain signals decide where a piece lands.
const HIST_CORROBORATED = ['deadseascrolls.org.il', 'britishmuseum.org', 'metmuseum.org', 'louvre.fr', 'biblicalarchaeology.org', 'asor.org', 'israelantiquities.org', 'nature.com', 'science.org', 'sciencedirect.com', 'smithsonianmag.com', 'loc.gov', 'ncse.ngo']
const SCHOLARLY_CONSENSUS = ['brill.com', 'jstor.org', 'cambridge.org', 'oxfordacademic.com', 'academia.edu', 'bibleinterp.com', 'wikipedia.org']
const ACADEMIC_TLDS = ['.edu', 'eprints', 'digitalcommons', 'scholarworks', 'etd.', 'czasopisma', 'byustudies', 'ohiolink']
const TEXTUAL = ['intertextual.bible']
const VISIONARY = ['emmerich', 'bookofenoch2020', 'ecatholic2000']
const CONTESTED = ['vridar.org', 'thetorah.com']
const DEVOTIONAL = ['thegospelcoalition.org', 'catholicproductions.com', 'faithtacoma.org', 'christchurchjerusalem.org', 'gospelworthdyingfor.com', 'equip.sbts.edu', 'drmsh.com', 'scripturecentral.org', 'nextstepbiblestudy.net', 'theeasternchurch.com', 'ethiopianorthodox.org', 'biola.edu']

const has = (domain, list) => list.some((d) => domain === d || domain.includes(d))

function deriveClaimType(source) {
  const d = source.domain || ''
  const tier = source.credibilityTier
  if (tier === 'community-lead') return 'speculative'
  if (has(d, TEXTUAL)) return 'textually-attested'
  if (has(d, VISIONARY)) return 'visionary-private-revelation'
  if (has(d, HIST_CORROBORATED)) return 'historically-corroborated'
  if (has(d, CONTESTED)) return 'contested-minority'
  if (has(d, SCHOLARLY_CONSENSUS) || ACADEMIC_TLDS.some((t) => d.includes(t))) return 'scholarly-consensus'
  if (has(d, DEVOTIONAL)) return 'tradition-devotional'
  // Fallback by credibility tier.
  if (tier === 'peer-reviewed') return 'historically-corroborated'
  if (tier === 'reputable-reference') return 'scholarly-consensus'
  if (tier === 'self-published') return 'speculative'
  return 'tradition-devotional' // popular-journalistic default
}

// Perspective (who holds the view) — light, domain-driven; many pieces get none.
function derivePerspective(source) {
  const d = source.domain || ''
  if (source.credibilityTier === 'community-lead') return 'fringe-speculative'
  if (has(d, VISIONARY)) return 'mystical-visionary'
  if (d.includes('ethiopianorthodox') || d.includes('theeasternchurch')) return 'ethiopian-tewahedo'
  if (d.includes('catholic') || d.includes('ecatholic')) return 'catholic'
  if (d.includes('thetorah') || d === 'jstor.org') return null // mixed; leave for review
  if (has(d, HIST_CORROBORATED) || has(d, SCHOLARLY_CONSENSUS) || ACADEMIC_TLDS.some((t) => d.includes(t))) return 'secular-academic'
  if (has(d, DEVOTIONAL)) return 'mainstream-christian'
  return null
}

const validClaim = new Set((await db.claimType.findMany({ select: { slug: true } })).map((c) => c.slug))
const validPersp = new Map((await db.perspectiveTag.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]))

const evidences = await db.evidence.findMany({ include: { source: true } })
const dist = {}
let claimSet = 0, perspSet = 0
for (const ev of evidences) {
  const claim = deriveClaimType(ev.source)
  if (!validClaim.has(claim)) continue
  await db.evidence.update({ where: { id: ev.id }, data: { claimTypeSlug: claim } })
  dist[claim] = (dist[claim] || 0) + 1
  claimSet++

  const persp = derivePerspective(ev.source)
  if (persp && validPersp.has(persp)) {
    const tagId = validPersp.get(persp)
    const exists = await db.evidencePerspective.findFirst({ where: { evidenceId: ev.id, perspectiveId: tagId } })
    if (!exists) { await db.evidencePerspective.create({ data: { evidenceId: ev.id, perspectiveId: tagId } }); perspSet++ }
  }
}

console.error(`[classify-evidence] filed ${claimSet} evidence into claim types, +${perspSet} perspective links`)
console.error('[classify-evidence] verifiability distribution:')
const ladder = ['textually-attested', 'historically-corroborated', 'scholarly-consensus', 'contested-minority', 'tradition-devotional', 'visionary-private-revelation', 'speculative']
for (const c of ladder) if (dist[c]) console.error(`  ${String(dist[c]).padStart(3)}  ${c}`)
await db.$disconnect()
