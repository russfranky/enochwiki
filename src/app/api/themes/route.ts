// Themes explorer — list themes and fetch verses per theme
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    const themes = await db.theme.findMany({
      orderBy: { name: 'asc' },
      include: {
        verseLinks: { include: { verse: { include: { book: true } } } },
      },
    })
    return NextResponse.json({
      themes: themes.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        verseCount: t.verseLinks.length,
      })),
    })
  }

  const theme = await db.theme.findUnique({
    where: { slug },
    include: {
      verseLinks: {
        include: {
          verse: {
            include: {
              book: true,
              chapter: true,
            },
          },
        },
      },
    },
  })
  if (!theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
  }

  return NextResponse.json({
    theme: {
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      category: theme.category,
      description: theme.description,
    },
    verses: theme.verseLinks.map((tl) => ({
      id: tl.verse.id,
      ref: `${tl.verse.book.slug} ${tl.verse.chapter.number}:${tl.verse.verseNum}`,
      book: tl.verse.book.name,
      chapterNum: tl.verse.chapter.number,
      verseNum: tl.verse.verseNum,
      text: tl.verse.text,
      weight: tl.weight,
    })),
  })
}
