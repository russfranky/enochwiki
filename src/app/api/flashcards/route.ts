// Flashcards — review API (list due cards, record a review, delete).
// Generation was removed by owner order 2026-11-09; existing cards remain reviewable.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const deck = searchParams.get('deck')
  const dueOnly = searchParams.get('due') === '1'

  const where: any = {}
  if (deck) where.deckSlug = deck
  if (dueOnly) where.dueDate = { lte: new Date() }

  const cards = await db.flashcard.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    take: 100,
  })
  return NextResponse.json({ cards })
}

// Review a flashcard (SM-2 algorithm)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, quality } = body as { id: string; quality: number } // 0-5 (0=forgot, 5=perfect)

  if (!id || typeof quality !== 'number' || quality < 0 || quality > 5) {
    return NextResponse.json({ error: 'id and quality (0-5) required' }, { status: 400 })
  }

  const card = await db.flashcard.findUnique({ where: { id } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  // SM-2 algorithm
  let { easeFactor, interval, repetitions } = card
  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions += 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(interval * easeFactor)
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)

  const updated = await db.flashcard.update({
    where: { id },
    data: {
      easeFactor,
      interval,
      repetitions,
      dueDate,
      lastReviewed: new Date(),
    },
  })

  return NextResponse.json({ card: updated })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.flashcard.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
