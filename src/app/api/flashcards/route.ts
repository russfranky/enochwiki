// Flashcards — CRUD + auto-generate from scripture
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
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

// Auto-generate flashcards from a chapter
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bookSlug, chapterNum, count = 8 } = body as { bookSlug: string; chapterNum: number; count?: number }

  const book = await db.book.findUnique({ where: { slug: bookSlug } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const chapter = await db.chapter.findFirst({
    where: { bookId: book.id, number: chapterNum },
    include: { verses: { orderBy: { verseNum: 'asc' } } },
  })
  if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const versesText = chapter.verses.map((v) => `${v.chapterNum}:${v.verseNum} — ${v.text}`).join('\n')

  const zai = await ZAI.create()
  let completion
  try {
    completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are generating spaced-repetition flashcards for an Ethiopian Bible study database. Generate ${count} flashcards from the chapter provided. Each flashcard has a "front" (question or prompt) and "back" (answer with specific verse citation).

Format your response as a JSON array of objects with this exact shape:
{"front": "question", "back": "answer with verse citation", "scriptureRef": "1-enoch 6:2"}

The back of each card MUST cite the specific verse. The front should be a focused question testing comprehension, not rote memorization.

Only output the JSON array, no other text.`,
        },
        {
          role: 'user',
          content: `Generate ${count} flashcards from:\n\n**${book.name} chapter ${chapter.number}**\n\n${versesText}`,
        },
      ],
      model: 'glm-4.5',
    } as any)
  } catch (apiErr: any) {
    const errMsg = apiErr?.message || String(apiErr)
    if (errMsg.includes('1113') || errMsg.includes('Insufficient balance') || errMsg.includes('429')) {
      return NextResponse.json({
        error: 'Z.ai API has insufficient balance. Add credits at https://z.ai/ to generate flashcards.',
      }, { status: 503 })
    }
    throw apiErr
  }

  const raw = completion?.choices?.[0]?.message?.content ?? '[]'
  let cards: { front: string; back: string; scriptureRef: string }[] = []
  try {
    // Find JSON array in response
    const match = raw.match(/\[[\s\S]*\]/)
    cards = match ? JSON.parse(match[0]) : []
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }

  // Save cards
  const created = []
  for (const c of cards.slice(0, count)) {
    if (!c.front || !c.back) continue
    const card = await db.flashcard.create({
      data: {
        deckSlug: `${bookSlug}-${chapterNum}`,
        front: c.front,
        back: c.back,
        scriptureRef: c.scriptureRef || `${bookSlug} ${chapterNum}:*`,
        dueDate: new Date(),
      },
    })
    created.push(card)
  }

  return NextResponse.json({ generated: created.length, cards: created })
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
