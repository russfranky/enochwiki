// Rebuild FTS5 indexes — re-populate from current Verse, Source, Evidence rows
import { db } from '../src/lib/db'

async function main() {
  console.log('🔧 Rebuilding FTS5 indexes...')

  // ── verses_fts ──
  await db.$executeRawUnsafe(`DELETE FROM verses_fts;`)
  const verseRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid, bookId, chapterNum, verseNum, text FROM Verse;`
  )
  for (const v of verseRows) {
    const book = await db.book.findUnique({ where: { id: v.bookId } })
    if (!book) continue
    await db.$executeRawUnsafe(
      `INSERT INTO verses_fts(rowid, ref, text, book_name) VALUES (?, ?, ?, ?);`,
      v.rowid,
      `${book.slug}-${v.chapterNum}:${v.verseNum}`,
      v.text,
      book.name,
    )
  }
  console.log(`  ✓ verses_fts: ${verseRows.length} records`)

  // ── sources_fts ──
  await db.$executeRawUnsafe(`DELETE FROM sources_fts;`)
  const sourceRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid, title, summary, content, domain FROM Source;`
  )
  for (const s of sourceRows) {
    await db.$executeRawUnsafe(
      `INSERT INTO sources_fts(rowid, title, summary, content, domain) VALUES (?, ?, ?, ?, ?);`,
      s.rowid,
      s.title,
      s.summary || '',
      s.content || '',
      s.domain,
    )
  }
  console.log(`  ✓ sources_fts: ${sourceRows.length} records`)

  // ── evidence_fts ──
  await db.$executeRawUnsafe(`DELETE FROM evidence_fts;`)
  const evidenceRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid, scriptureRef, claim, corroboration, notes FROM Evidence;`
  )
  for (const e of evidenceRows) {
    await db.$executeRawUnsafe(
      `INSERT INTO evidence_fts(rowid, scripture_ref, claim, corroboration, notes) VALUES (?, ?, ?, ?, ?);`,
      e.rowid,
      e.scriptureRef,
      e.claim,
      e.corroboration,
      e.notes || '',
    )
  }
  console.log(`  ✓ evidence_fts: ${evidenceRows.length} records`)

  // Test
  const testVerses = await db.$queryRawUnsafe<any[]>(
    `SELECT v.id, v.text, snippet(verses_fts, 1, '<mark>', '</mark>', '...', 12) as highlight FROM verses_fts JOIN Verse v ON v.rowid = verses_fts.rowid WHERE verses_fts MATCH ? LIMIT 3`,
    '"watchers"'
  )
  console.log(`  test "watchers": ${testVerses.length} verses found`)

  await db.$disconnect()
  console.log('✅ FTS rebuild complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
