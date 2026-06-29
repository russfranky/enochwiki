// Reader's lens — recompose the picture under your own include/exclude choices.
// Demonstrates the "no house narrative" feature: disconnect any source, person,
// institution, perspective, or verifiability tier and see how the picture repaints.
//
//   node --env-file=.env scripts/lens.mjs --exclude-domain smithsonianmag.com
//   node --env-file=.env scripts/lens.mjs --exclude-authority the-british-museum --no-leads
//   node --env-file=.env scripts/lens.mjs --exclude-perspective fringe-speculative --min-cred 0.6
//   node --env-file=.env scripts/lens.mjs --list      # show what's available to exclude
//
// Repeatable flags: --exclude-domain, --exclude-authority (slug), --exclude-perspective
// (slug), --exclude-tier, --exclude-claimtype. Plus --min-cred N, --no-leads.

import { PrismaClient } from '@prisma/client'
import { applyLens, LADDER } from '../src/lib/lens-core.mjs'
const db = new PrismaClient()

// Parse repeatable CLI flags into a lens.
const argv = process.argv.slice(2)
const lens = { excludeDomains: [], excludeAuthorities: [], excludePerspectives: [], excludeTiers: [], excludeClaimTypes: [] }
let LIST = false
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--exclude-domain') lens.excludeDomains.push(argv[++i])
  else if (a === '--exclude-authority') lens.excludeAuthorities.push(argv[++i])
  else if (a === '--exclude-perspective') lens.excludePerspectives.push(argv[++i])
  else if (a === '--exclude-tier') lens.excludeTiers.push(argv[++i])
  else if (a === '--exclude-claimtype') lens.excludeClaimTypes.push(argv[++i])
  else if (a === '--min-cred') lens.minCredibility = parseFloat(argv[++i])
  else if (a === '--no-leads') lens.noLeads = true
  else if (a === '--list') LIST = true
}

const evs = await db.evidence.findMany({
  include: {
    source: { include: { authorityLinks: { include: { authority: true } } } },
    perspectiveLinks: { include: { perspective: true } },
  },
})
const norm = evs.map((ev) => ({
  id: ev.id, sourceId: ev.sourceId,
  topic: ev.source?.keywords || 'unlabelled',
  claimType: ev.claimTypeSlug,
  solid: ['textually-attested', 'historically-corroborated', 'scholarly-consensus'].includes(ev.claimTypeSlug),
  domain: ev.source?.domain, tier: ev.source?.credibilityTier, credibility: ev.source?.credibility ?? 0,
  isLead: ev.source?.credibilityTier === 'community-lead',
  authoritySlugs: (ev.source?.authorityLinks || []).map((l) => l.authority.slug),
  perspectiveSlugs: (ev.perspectiveLinks || []).map((l) => l.perspective.slug),
  scriptureRef: ev.scriptureRef, book: ev.scriptureRef ? ev.scriptureRef.split(' ')[0] : null,
}))

if (LIST) {
  const auth = await db.authority.findMany({ include: { sourceLinks: true }, orderBy: { credibility: 'desc' } })
  console.error('Authorities you can disconnect (--exclude-authority <slug>):')
  for (const a of auth.filter((x) => x.sourceLinks.length)) console.error(`  ${a.slug.padEnd(42)} ${a.kind} ${Math.round(a.credibility * 100)}% (${a.sourceLinks.length} sources)`)
  const domains = [...new Set(norm.map((n) => n.domain))].sort()
  console.error(`\nDomains (--exclude-domain): ${domains.join(', ')}`)
  await db.$disconnect(); process.exit(0)
}

const r = applyLens(norm, lens)
const fmt = (l) => LADDER.filter((c) => l[c]).map((c) => `${c.split('-')[0]}:${l[c]}`).join('  ')

console.error(`\n  LENS: ${JSON.stringify(lens, (k, v) => (Array.isArray(v) && !v.length ? undefined : v))}\n`)
console.error(`  Full picture     → ${r.baseline.evidence} evidence, ${r.baseline.sources} sources, ${r.baseline.solidTotal} solid`)
console.error(`                     ${fmt(r.baseline.ladder)}`)
console.error(`  Your picture     → ${r.filtered.evidence} evidence, ${r.filtered.sources} sources, ${r.filtered.solidTotal} solid`)
console.error(`                     ${fmt(r.filtered.ladder)}`)
console.error(`\n  What your choices changed:`)
console.error(`    − ${r.delta.removedEvidence} evidence, − ${r.delta.removedSources} sources, − ${r.delta.removedSolid} solid pieces`)
if (r.delta.topicsFlippedToGap.length) {
  console.error(`    ⚠️  ${r.delta.topicsFlippedToGap.length} topic(s) lost ALL independent corroboration under your lens:`)
  for (const t of r.delta.topicsFlippedToGap) console.error(`        · ${t}`)
} else {
  console.error(`    ✓ no topic lost all of its corroboration — the picture holds.`)
}
console.error('')
await db.$disconnect()
