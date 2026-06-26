// FTS5 full-text search across verses, sources, evidence
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  // Build FTS5 query — escape special chars and use OR for multi-word
  const ftsQuery = q.split(/\s+/).map((w) => `"${w.replace(/"/g, '""')}"`).join(' ')

  // Search verses
  let verses: any[] = []
  try {
    const verseRows = await db.$queryRawUnsafe<any[]>(
      `SELECT v.id, v.bookId, v.chapterNum, v.verseNum, v.text,
              b.slug as bookSlug, b.name as bookName, b.geezName as bookGeezName,
              snippet(verses_fts, 1, '<mark>', '</mark>', '...', 12) as highlight
       FROM verses_fts
       JOIN Verse v ON v.rowid = verses_fts.rowid
       JOIN Book b ON b.id = v.bookId
       WHERE verses_fts MATCH ?
       LIMIT ?`,
      ftsQuery,
      limit,
    )
    // Compute rank separately (bm25 needs to be in the same query)
    verses = verseRows.map((r: any, i: number) => ({ ...r, rank: -i }))
  } catch (e) {
    console.error('[fts] verses error:', e)
  }

  // Search sources
  let sources: any[] = []
  try {
    const sourceRows = await db.$queryRawUnsafe<any[]>(
      `SELECT s.id, s.url, s.title, s.domain, s.category, s.credibilityTier, s.credibility,
              snippet(sources_fts, 0, '<mark>', '</mark>', '...', 24) as titleHighlight,
              snippet(sources_fts, 1, '<mark>', '</mark>', '...', 32) as summaryHighlight
       FROM sources_fts
       JOIN Source s ON s.rowid = sources_fts.rowid
       WHERE sources_fts MATCH ?
       LIMIT ?`,
      ftsQuery,
      Math.min(limit, 10),
    )
    sources = sourceRows
  } catch (e) {
    console.error('[fts] sources error:', e)
  }

  // Search evidence
  let evidence: any[] = []
  try {
    const evidenceRows = await db.$queryRawUnsafe<any[]>(
      `SELECT e.id, e.scriptureRef, e.claim, e.corroboration, e.alignment, e.confidence,
              e.reviewState, e.blindspot,
              snippet(evidence_fts, 1, '<mark>', '</mark>', '...', 24) as claimHighlight,
              snippet(evidence_fts, 2, '<mark>', '</mark>', '...', 32) as corrobHighlight
       FROM evidence_fts
       JOIN Evidence e ON e.rowid = evidence_fts.rowid
       WHERE evidence_fts MATCH ?
       LIMIT ?`,
      ftsQuery,
      Math.min(limit, 10),
    )
    evidence = evidenceRows
  } catch (e) {
    console.error('[fts] evidence error:', e)
  }

  return NextResponse.json({
    q,
    verses: verses.map((r) => ({
      id: r.id,
      ref: `${r.bookSlug} ${r.chapterNum}:${r.verseNum}`,
      book: r.bookName,
      bookGeezName: r.bookGeezName,
      text: r.text,
      highlight: r.highlight,
      rank: r.rank,
    })),
    sources: sources.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      domain: r.domain,
      category: r.category,
      credibilityTier: r.credibilityTier,
      credibility: r.credibility,
      summaryHighlight: r.summaryHighlight,
    })),
    evidence: evidence.map((r) => ({
      id: r.id,
      scriptureRef: r.scriptureRef,
      claim: r.claim,
      corroboration: r.corroboration,
      alignment: r.alignment,
      confidence: r.confidence,
      reviewState: r.reviewState,
      blindspot: r.blindspot === 1 || r.blindspot === true,
      claimHighlight: r.claimHighlight,
      corrobHighlight: r.corrobHighlight,
    })),
  })
}
