// Editorial review workflow — queue, approve/reject, checklist, audit log
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_STATES = ['draft', 'auto-corroborated', 'in-review', 'approved', 'rejected', 'needs-revision', 'archived']
const VALID_ITEM_TYPES = ['evidence', 'public-article', 'topic-page', 'source']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state')
  const itemType = searchParams.get('itemType')

  // Build review queue — items needing review
  const where: any = {}
  if (state === 'in-review') {
    // Special: 'in-review' filter returns both in-review and auto-corroborated items
    where.state = { in: ['in-review', 'auto-corroborated'] }
  } else if (state) {
    where.state = state
  }
  if (itemType) where.itemType = itemType

  // Get the latest ReviewRecord per item
  const records = await db.reviewRecord.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })

  // Hydrate with item data
  const hydrated = await Promise.all(
    records.map(async (r) => {
      let item: any = null
      if (r.itemType === 'evidence') {
        item = await db.evidence.findUnique({
          where: { id: r.itemId },
          include: { source: true, perspectiveLinks: { include: { perspective: true } } },
        })
      } else if (r.itemType === 'public-article') {
        item = await db.publicArticle.findUnique({
          where: { id: r.itemId },
          include: { perspectiveLinks: { include: { perspective: true } } },
        })
      } else if (r.itemType === 'topic-page') {
        item = await db.topicPage.findUnique({ where: { id: r.itemId } })
      }
      return { ...r, item }
    }),
  )

  // Also get audit log
  const auditLog = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    queue: hydrated.filter((h) => h.item !== null),
    auditLog,
    counts: {
      draft: await db.reviewRecord.count({ where: { state: 'draft' } }),
      autoCorroborated: await db.reviewRecord.count({ where: { state: 'auto-corroborated' } }),
      inReview: await db.reviewRecord.count({ where: { state: 'in-review' } }),
      approved: await db.reviewRecord.count({ where: { state: 'approved' } }),
      rejected: await db.reviewRecord.count({ where: { state: 'rejected' } }),
      needsRevision: await db.reviewRecord.count({ where: { state: 'needs-revision' } }),
    },
  })
}

// Update item state — transition with audit log
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { itemType, itemId, action, reviewer = 'editor', reviewerRole = 'reviewer', notes, checklist } = body as {
    itemType: string
    itemId: string
    action: 'submit-review' | 'approve' | 'reject' | 'request-revision' | 'archive'
    reviewer?: string
    reviewerRole?: string
    notes?: string
    checklist?: any
  }

  if (!VALID_ITEM_TYPES.includes(itemType)) {
    return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 })
  }

  // Map action → new state
  const stateMap: Record<string, string> = {
    'submit-review': 'in-review',
    'approve': 'approved',
    'reject': 'rejected',
    'request-revision': 'needs-revision',
    'archive': 'archived',
  }
  const newState = stateMap[action]
  if (!newState) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  // Compute checklist if not provided
  let computedChecklist = checklist
  if (!computedChecklist && itemType === 'evidence') {
    const evidence = await db.evidence.findUnique({
      where: { id: itemId },
      include: { source: true, perspectiveLinks: { include: { perspective: true } } },
    })
    if (evidence) {
      computedChecklist = {
        sourcesCited: !!evidence.source,
        credibilityTierMet: ['peer-reviewed', 'reputable-reference'].includes(evidence.source?.credibilityTier || ''),
        claimTypeLabeled: !!evidence.claimTypeSlug,
        perspectivesRepresented: evidence.perspectiveLinks.length >= 1,
        noFabrication: true, // human reviewer confirms
        contestedFlagged: evidence.blindspot === true,
        authorityNotOverstated: true, // human reviewer confirms
      }
    }
  }

  // Get current version + current state
  const existing = await db.reviewRecord.findFirst({
    where: { itemType, itemId },
    orderBy: { version: 'desc' },
  })
  const newVersion = (existing?.version || 0) + 1

  // Enforce the editorial state machine — an action is only valid from certain
  // current states. Without this, any item could be approved straight from draft
  // or a rejected item re-approved, bypassing the gate.
  const currentState = existing?.state || 'draft'
  const allowedFrom: Record<string, string[]> = {
    'submit-review': ['draft', 'auto-corroborated', 'needs-revision'],
    'approve': ['in-review', 'auto-corroborated'],
    'reject': ['in-review', 'auto-corroborated', 'needs-revision'],
    'request-revision': ['in-review', 'auto-corroborated'],
    'archive': ['draft', 'auto-corroborated', 'in-review', 'approved', 'rejected', 'needs-revision'],
  }
  if (!allowedFrom[action].includes(currentState)) {
    return NextResponse.json(
      { error: `Cannot '${action}' from state '${currentState}'` },
      { status: 409 },
    )
  }

  // Create new ReviewRecord
  const record = await db.reviewRecord.create({
    data: {
      itemType,
      itemId,
      state: newState,
      reviewer,
      reviewerRole,
      checklist: computedChecklist ? JSON.stringify(computedChecklist) : null,
      notes,
      version: newVersion,
    },
  })

  // Update the actual item's state
  if (itemType === 'evidence') {
    await db.evidence.update({
      where: { id: itemId },
      data: {
        reviewState: newState,
        publishedAt: newState === 'approved' ? new Date() : null,
      },
    })
  } else if (itemType === 'public-article') {
    await db.publicArticle.update({
      where: { id: itemId },
      data: {
        reviewState: newState,
        publishedAt: newState === 'approved' ? new Date() : null,
      },
    })
  } else if (itemType === 'topic-page') {
    await db.topicPage.update({
      where: { id: itemId },
      data: {
        reviewState: newState,
        publishedAt: newState === 'approved' ? new Date() : null,
      },
    })
  }

  // Audit log entry
  await db.auditLog.create({
    data: {
      action,
      itemType,
      itemId,
      actor: reviewer,
      actorRole: reviewerRole,
      details: JSON.stringify({ newState, notes, checklist: computedChecklist }),
    },
  })

  return NextResponse.json({ record, checklist: computedChecklist })
}
