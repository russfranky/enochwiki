// Lens engine (pure, no DB) — recompose the evidentiary picture under a reader's
// own include/exclude choices, across every axis. The point: there is no house
// narrative. A reader who distrusts a source, an institution, a person, a
// perspective, or a whole verifiability tier can disconnect it and see how the
// picture repaints — and exactly what that choice cost or changed.
//
// Shared by scripts/lens.mjs (CLI) and src/app/api/lens/route.ts (frontend).
//
// An evidence item is normalized to:
//   { id, topic, claimType, solid, domain, tier, credibility, isLead,
//     authoritySlugs:[], perspectiveSlugs:[], scriptureRef, book }

export const LADDER = [
  'textually-attested', 'historically-corroborated', 'scholarly-consensus',
  'contested-minority', 'tradition-devotional', 'visionary-private-revelation', 'speculative',
]
export const SOLID = new Set(['textually-attested', 'historically-corroborated', 'scholarly-consensus'])

// A lens is a set of exclusions / floors. Empty lens = the full picture.
export function keep(ev, lens = {}) {
  const ex = (arr, v) => Array.isArray(arr) && arr.includes(v)
  const exAny = (arr, vs) => Array.isArray(arr) && vs.some((v) => arr.includes(v))
  if (ex(lens.excludeDomains, ev.domain)) return false
  if (ex(lens.excludeTiers, ev.tier)) return false
  if (ex(lens.excludeClaimTypes, ev.claimType)) return false
  if (exAny(lens.excludeAuthorities, ev.authoritySlugs)) return false
  if (exAny(lens.excludePerspectives, ev.perspectiveSlugs)) return false
  if (typeof lens.minCredibility === 'number' && ev.credibility < lens.minCredibility) return false
  if (lens.noLeads && ev.isLead) return false
  return true
}

// Compose a picture from a set of normalized evidence items.
export function compose(evidences) {
  const ladder = Object.fromEntries(LADDER.map((c) => [c, 0]))
  const topics = {}
  const refs = new Set()
  const bookRefs = {}
  for (const ev of evidences) {
    if (ev.claimType && ladder[ev.claimType] != null) ladder[ev.claimType]++
    const t = (topics[ev.topic] ||= { total: 0, solid: 0 })
    t.total++
    if (ev.solid) t.solid++
    if (ev.scriptureRef) refs.add(ev.scriptureRef)
    if (ev.book) (bookRefs[ev.book] ||= new Set()).add(ev.scriptureRef)
  }
  const topicList = Object.entries(topics).map(([topic, v]) => ({ topic, ...v, gap: v.solid === 0 }))
  return {
    evidence: evidences.length,
    sources: new Set(evidences.map((e) => e.sourceId)).size,
    ladder,
    solidTotal: evidences.filter((e) => e.solid).length,
    topics: topicList,
    gaps: topicList.filter((t) => t.gap).map((t) => t.topic),
    coveredRefs: refs.size,
  }
}

// Apply a lens and report what changed vs the full picture.
export function applyLens(allEvidences, lens = {}) {
  const baseline = compose(allEvidences)
  const kept = allEvidences.filter((ev) => keep(ev, lens))
  const filtered = compose(kept)
  const baseGaps = new Set(baseline.gaps)
  const newGaps = filtered.gaps.filter((t) => !baseGaps.has(t)) // flipped to gap by the lens
  return {
    lens,
    baseline,
    filtered,
    delta: {
      removedEvidence: baseline.evidence - filtered.evidence,
      removedSources: baseline.sources - filtered.sources,
      removedSolid: baseline.solidTotal - filtered.solidTotal,
      topicsFlippedToGap: newGaps,
    },
  }
}
