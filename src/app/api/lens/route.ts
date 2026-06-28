// Reader's lens API — recompose the evidentiary picture under the reader's own
// include/exclude choices. No house narrative: the frontend offers toggles for
// every source, person, institution, perspective, and verifiability tier, and
// this endpoint repaints the picture (and reports what each choice changed).
//
//   GET  /api/lens          → the menu of things a reader can disconnect
//   POST /api/lens { ...lens } → the recomposed picture + delta vs the full picture
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// Pure engine shared with scripts/lens.mjs
import { applyLens } from '@/lib/lens-core.mjs'

export const runtime = 'nodejs'

const SOLID = ['textually-attested', 'historically-corroborated', 'scholarly-consensus']

async function loadNormalized() {
  const evs = await db.evidence.findMany({
    include: {
      source: { include: { authorityLinks: { include: { authority: true } } } },
      perspectiveLinks: { include: { perspective: true } },
    },
  })
  return evs.map((ev) => ({
    id: ev.id,
    sourceId: ev.sourceId,
    topic: ev.source?.keywords || 'unlabelled',
    claimType: ev.claimTypeSlug,
    solid: SOLID.includes(ev.claimTypeSlug ?? ''),
    domain: ev.source?.domain,
    tier: ev.source?.credibilityTier,
    credibility: ev.source?.credibility ?? 0,
    isLead: ev.source?.credibilityTier === 'community-lead',
    authoritySlugs: (ev.source?.authorityLinks ?? []).map((l) => l.authority.slug),
    perspectiveSlugs: (ev.perspectiveLinks ?? []).map((l) => l.perspective.slug),
    scriptureRef: ev.scriptureRef,
    book: ev.scriptureRef ? ev.scriptureRef.split(' ')[0] : null,
  }))
}

// GET — the menu of disconnectable axes for the UI controls.
export async function GET() {
  const [authorities, sources, perspectives, claimTypes] = await Promise.all([
    db.authority.findMany({ include: { sourceLinks: true }, orderBy: { credibility: 'desc' } }),
    db.source.findMany({ select: { domain: true, credibilityTier: true } }),
    db.perspectiveTag.findMany({ select: { slug: true, name: true } }),
    db.claimType.findMany({ select: { slug: true, name: true } }),
  ])
  const domains = [...new Set(sources.map((s) => s.domain))].sort()
  const tiers = [...new Set(sources.map((s) => s.credibilityTier))].sort()
  return NextResponse.json({
    authorities: authorities
      .filter((a) => a.sourceLinks.length)
      .map((a) => ({ slug: a.slug, name: a.name, kind: a.kind, credibility: a.credibility, tier: a.credibilityTier, basis: a.verificationBasis, sources: a.sourceLinks.length })),
    domains,
    tiers,
    perspectives,
    claimTypes,
  })
}

// POST — apply the reader's lens and return the recomposed picture + delta.
export async function POST(req: NextRequest) {
  let lens: Record<string, unknown> = {}
  try {
    lens = (await req.json()) as Record<string, unknown>
  } catch {
    lens = {}
  }
  const norm = await loadNormalized()
  const result = applyLens(norm, lens)
  return NextResponse.json(result)
}
