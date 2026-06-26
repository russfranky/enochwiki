// Scripture reader — fetch books, chapters, verses, and themes
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookSlug = searchParams.get('book')
  const chapterNum = searchParams.get('chapter')

  // List all books
  if (!bookSlug) {
    const books = await db.book.findMany({
      orderBy: { order: 'asc' },
      include: {
        chapters: { orderBy: { number: 'asc' } },
      },
    })
    return NextResponse.json({ books })
  }

  const book = await db.book.findUnique({
    where: { slug: bookSlug },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const targetChapter = chapterNum ? parseInt(chapterNum, 10) : book.chapters[0]?.number
  if (!targetChapter) {
    return NextResponse.json({ book, chapter: null, verses: [] })
  }

  const chapter = await db.chapter.findFirst({
    where: { bookId: book.id, number: targetChapter },
  })
  if (!chapter) {
    return NextResponse.json({ book, chapter: null, verses: [] })
  }

  const verses = await db.verse.findMany({
    where: { chapterId: chapter.id },
    orderBy: { verseNum: 'asc' },
    include: { themeLinks: { include: { theme: true } } },
  })

  return NextResponse.json({
    book,
    chapter,
    verses: verses.map((v) => ({
      id: v.id,
      verseNum: v.verseNum,
      text: v.text,
      geezText: v.geezText,
      ref: `${book.slug} ${chapter.number}:${v.verseNum}`,
      themes: v.themeLinks.map((tl) => ({
        slug: tl.theme.slug,
        name: tl.theme.name,
        weight: tl.weight,
      })),
    })),
  })
}
