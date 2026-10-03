// Full-text search across verses, sources, evidence
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// D-027: escape LIKE wildcards in the user query. Prisma `contains` emits
// LIKE without an ESCAPE clause, so a literal % or _ typed by the user
// would act as a wildcard and return wrong matches. These raw queries stay
// parameterized (no injection risk) and declare ESCAPE explicitly so %
// and _ match literally.
const likePattern = (q: string) =>
  `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  const pattern = likePattern(q)

  // SQLite LIKE search across verses
  const verses = await db.$queryRaw<Array<{
    id: string; text: string; verseNum: number
    bookSlug: string; bookName: string; chapterNum: number
  }>>`
    SELECT v.id, v.text, v."verseNum",
           b.slug AS "bookSlug", b.name AS "bookName", c.number AS "chapterNum"
    FROM "Verse" v
    JOIN "Book" b ON b.id = v."bookId"
    JOIN "Chapter" c ON c.id = v."chapterId"
    WHERE v.text LIKE ${pattern} ESCAPE '\\'
    ORDER BY v.id ASC
    LIMIT 30`

  const sources = await db.$queryRaw<Array<{
    id: string; url: string; title: string; domain: string
    category: string; credibility: number; summary: string | null
  }>>`
    SELECT id, url, title, domain, category, credibility, summary
    FROM "Source"
    WHERE title LIKE ${pattern} ESCAPE '\\'
       OR summary LIKE ${pattern} ESCAPE '\\'
       OR content LIKE ${pattern} ESCAPE '\\'
    LIMIT 20`

  const evidence = await db.$queryRaw<Array<{
    id: string; scriptureRef: string; claim: string; corroboration: string
    alignment: string; confidence: number
    sourceTitle: string | null; sourceUrl: string | null
    sourceDomain: string | null; sourceCredibility: number | null
  }>>`
    SELECT e.id, e."scriptureRef", e.claim, e.corroboration, e.alignment, e.confidence,
           s.title AS "sourceTitle", s.url AS "sourceUrl",
           s.domain AS "sourceDomain", s.credibility AS "sourceCredibility"
    FROM "Evidence" e
    LEFT JOIN "Source" s ON s.id = e."sourceId"
    WHERE e.claim LIKE ${pattern} ESCAPE '\\'
       OR e.corroboration LIKE ${pattern} ESCAPE '\\'
       OR e.notes LIKE ${pattern} ESCAPE '\\'
    LIMIT 20`

  return NextResponse.json({
    q,
    verses: verses.map((v) => ({
      id: v.id,
      ref: `${v.bookSlug} ${v.chapterNum}:${v.verseNum}`,
      book: v.bookName,
      chapterNum: v.chapterNum,
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
      source: e.sourceTitle
        ? {
            title: e.sourceTitle,
            url: e.sourceUrl,
            domain: e.sourceDomain,
            credibility: e.sourceCredibility,
          }
        : null,
    })),
  })
}
