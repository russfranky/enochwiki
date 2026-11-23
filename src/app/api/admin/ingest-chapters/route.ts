import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import payload from '../../../../../scripts/data/charles-1-enoch-missing.json'

// One-time additive ingest of the remaining R. H. Charles 1 Enoch
// chapters (SEO Phase 2 follow-up, 2026-11-23). The production Turso
// token is a sensitive Vercel env var and cannot be read back through
// the API, so the ingest runs here, inside the app's own runtime,
// gated by a one-time INGEST_KEY env var. The route and the key are
// removed in the follow-up cleanup change; the data file stays in
// scripts/data as the corpus source of record.
//
// Additive only: a chapter whose (bookId, number) already exists is
// skipped untouched, so the curated seed chapters are never modified
// and re-running the POST is safe.
export const runtime = 'nodejs'
export const maxDuration = 300

type ChapterPayload = {
  number: number
  title: string | null
  verses: { verseNum: number; text: string }[]
}

function keyMatches(provided: string | null): boolean {
  const expected = process.env.INGEST_KEY
  if (!expected || !provided) return false
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  if (!process.env.INGEST_KEY) {
    return NextResponse.json({ error: 'ingest not armed' }, { status: 503 })
  }
  if (!keyMatches(req.headers.get('x-ingest-key'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const book = await db.book.findUnique({ where: { slug: payload.bookSlug } })
  if (!book) {
    return NextResponse.json({ error: `book not found: ${payload.bookSlug}` }, { status: 404 })
  }

  let insertedChapters = 0
  let insertedVerses = 0
  let skippedChapters = 0

  for (const ch of payload.chapters as ChapterPayload[]) {
    const existing = await db.chapter.findFirst({
      where: { bookId: book.id, number: ch.number },
      select: { id: true },
    })
    if (existing) {
      skippedChapters++
      continue
    }
    const chapter = await db.chapter.create({
      data: { bookId: book.id, number: ch.number, title: ch.title },
    })
    // Insert verses in concurrent chunks; one round trip per verse is
    // the seed script's pattern, parallelized to fit the time budget.
    for (let i = 0; i < ch.verses.length; i += 25) {
      const chunk = ch.verses.slice(i, i + 25)
      await Promise.all(
        chunk.map((v) =>
          db.verse.create({
            data: {
              bookId: book.id,
              chapterId: chapter.id,
              chapterNum: ch.number,
              verseNum: v.verseNum,
              text: v.text,
            },
          }),
        ),
      )
      insertedVerses += chunk.length
    }
    insertedChapters++
  }

  const total = await db.chapter.count({ where: { bookId: book.id } })
  return NextResponse.json({
    ok: true,
    insertedChapters,
    insertedVerses,
    skippedChapters,
    totalChaptersForBook: total,
  })
}
