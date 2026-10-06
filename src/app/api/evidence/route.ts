// Evidence records — fetch corroboration tied to scripture refs or sources
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

export const runtime = 'nodejs'

// Raw crawl output is pipeline working material, not vetted evidence.
// Records whose claim is still the crawler's placeholder text
// ("Crawled for theme: ...") are kept in the database for review
// but never served as corroboration.
const VETTED_WHERE = {
  NOT: { claim: { startsWith: 'Crawled for theme:' } },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const sourceId = searchParams.get('sourceId')

  if (ref) {
    const evidences = await db.evidence.findMany({
      where: { scriptureRef: ref, ...VETTED_WHERE },
      orderBy: { confidence: 'desc' },
      include: { source: true },
    })
    return NextResponse.json({ ref, evidences })
  }

  if (sourceId) {
    const evidences = await db.evidence.findMany({
      where: { sourceId, ...VETTED_WHERE },
      orderBy: { createdAt: 'asc' },
      include: { source: true },
    })
    return NextResponse.json({ sourceId, evidences })
  }

  const all = await db.evidence.findMany({
    where: VETTED_WHERE,
    orderBy: { createdAt: 'desc' },
    include: { source: true },
    take: 200,
  })
  return NextResponse.json({ evidences: all })
}

// Update an evidence record's alignment/confidence (user refinement)
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const body = await req.json()
  const { id, alignment, confidence, notes } = body as {
    id: string
    alignment?: string
    confidence?: number
    notes?: string
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  // D-067 (cross-ref Worker A D-037): the allowlist must match the alignment
  // vocabulary the product documents and stores. The Prisma schema comment
  // defines "supports" | "challenges" | "contextualizes" | "neutral", the
  // synergy graph colors "challenges", and the database carries those values;
  // "contested"/"contradicts" appeared in no record, no UI surface, and no
  // other code path, so they are dropped from the allowlist.
  const ALIGNMENTS = ['supports', 'challenges', 'contextualizes', 'neutral']
  if (alignment !== undefined && !ALIGNMENTS.includes(alignment)) {
    return NextResponse.json(
      { error: `alignment must be one of: ${ALIGNMENTS.join(', ')}` },
      { status: 400 },
    )
  }

  const updated = await db.evidence.update({
    where: { id },
    data: {
      ...(alignment ? { alignment } : {}),
      ...(typeof confidence === 'number' ? { confidence } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })
  return NextResponse.json({ evidence: updated })
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await db.evidence.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
  }
  // Audit destructive removals — the AuditLog enumerates a 'delete' action but it
  // was never wired here, leaving deletions untraceable.
  await db.auditLog.create({
    data: { action: 'delete', itemType: 'evidence', itemId: id, actor: 'system', actorRole: 'contributor' },
  })
  return NextResponse.json({ ok: true })
}
