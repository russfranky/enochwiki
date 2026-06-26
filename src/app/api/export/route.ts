// Local backup/export — full JSON dump + Markdown digest
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const [books, themes, crossReferences, sources, evidence, notes, chatHistory] =
    await Promise.all([
      db.book.findMany({
        include: {
          chapters: {
            orderBy: { number: 'asc' },
            include: { verses: { orderBy: { verseNum: 'asc' } } },
          },
        },
        orderBy: { order: 'asc' },
      }),
      db.theme.findMany({
        include: {
          verseLinks: { include: { verse: { include: { book: true, chapter: true } } } },
        },
      }),
      db.crossReference.findMany(),
      db.source.findMany({ include: { evidences: true } }),
      db.evidence.findMany({ include: { source: true } }),
      db.note.findMany(),
      db.chatMessage.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

  const json = {
    exportedAt: new Date().toISOString(),
    books,
    themes: themes.map((t) => ({
      ...t,
      verses: t.verseLinks.map((tl) => ({
        ref: `${tl.verse.book.slug} ${tl.verse.chapter.number}:${tl.verse.verseNum}`,
        weight: tl.weight,
      })),
    })),
    crossReferences,
    sources,
    evidence,
    notes,
    chatHistory,
  }

  return NextResponse.json(json)
}
