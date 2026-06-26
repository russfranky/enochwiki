// Full-text search across verses, sources, evidence, notes
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  // SQLite LIKE search across verses
  const verses = await db.verse.findMany({
    where: { text: { contains: q } },
    take: 30,
    include: { book: true, chapter: true },
  })

  const sources = await db.source.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
        { content: { contains: q } },
      ],
    },
    take: 20,
  })

  const evidence = await db.evidence.findMany({
    where: {
      OR: [
        { claim: { contains: q } },
        { corroboration: { contains: q } },
        { notes: { contains: q } },
      ],
    },
    take: 20,
    include: { source: true },
  })

  return NextResponse.json({
    q,
    verses: verses.map((v) => ({
      id: v.id,
      ref: `${v.book.slug} ${v.chapter.number}:${v.verseNum}`,
      book: v.book.name,
      chapterNum: v.chapter.number,
      verseNum: v.verseNum,
      text: v.text,
    })),
    sources: sources.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      domain: s.domain,
      category: s.category,
      credibility: s.credibility,
      summary: s.summary,
    })),
    evidence: evidence.map((e) => ({
      id: e.id,
      scriptureRef: e.scriptureRef,
      claim: e.claim,
      corroboration: e.corroboration,
      alignment: e.alignment,
      confidence: e.confidence,
      source: e.source
        ? {
            title: e.source.title,
            url: e.source.url,
            domain: e.source.domain,
            credibility: e.source.credibility,
          }
        : null,
    })),
  })
}
