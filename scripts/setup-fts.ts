// Setup FTS5 with contentless tables — simpler, no triggers needed
import { db } from '../src/lib/db'

async function main() {
  console.log('🔧 Setting up FTS5 (contentless, no triggers)...')

  // Drop existing FTS tables and triggers
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS verses_ai;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS verses_ad;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS verses_au;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS sources_ai;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS sources_ad;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS sources_au;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS evidence_ai;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS evidence_ad;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS evidence_au;`).catch(() => {})

  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS verses_fts;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS sources_fts;`).catch(() => {})
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS evidence_fts;`).catch(() => {})

  // Create contentless FTS5 tables (no content= linkage, no triggers)
  await db.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE verses_fts USING fts5(
      ref, text, book_name, content='', tokenize='porter unicode61'
    );
  `)
  await db.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE sources_fts USING fts5(
      title, summary, content, domain, content='', tokenize='porter unicode61'
    );
  `)
  await db.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE evidence_fts USING fts5(
      scripture_ref, claim, corroboration, notes, content='', tokenize='porter unicode61'
    );
  `)
  console.log('  ✓ FTS5 tables created (contentless)')

  // Populate verses_fts
  const verseRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid as rid, bookId, chapterNum, verseNum, text FROM Verse;`
  )
  for (const v of verseRows) {
    const book = await db.book.findUnique({ where: { id: v.bookId } })
    if (!book) continue
    await db.$executeRawUnsafe(
      `INSERT INTO verses_fts(rowid, ref, text, book_name) VALUES (?, ?, ?, ?);`,
      v.rid,
      `${book.slug} ${v.chapterNum}:${v.verseNum}`,
      v.text,
      book.name,
    )
  }
  console.log(`  ✓ verses_fts: ${verseRows.length} records`)

  // Populate sources_fts
  const sourceRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid as rid, title, summary, content, domain FROM Source;`
  )
  for (const s of sourceRows) {
    await db.$executeRawUnsafe(
      `INSERT INTO sources_fts(rowid, title, summary, content, domain) VALUES (?, ?, ?, ?, ?);`,
      s.rid,
      s.title,
      s.summary || '',
      s.content || '',
      s.domain,
    )
  }
  console.log(`  ✓ sources_fts: ${sourceRows.length} records`)

  // Populate evidence_fts
  const evidenceRows = await db.$queryRawUnsafe<any[]>(
    `SELECT rowid as rid, scriptureRef, claim, corroboration, notes FROM Evidence;`
  )
  for (const e of evidenceRows) {
    await db.$executeRawUnsafe(
      `INSERT INTO evidence_fts(rowid, scripture_ref, claim, corroboration, notes) VALUES (?, ?, ?, ?, ?);`,
      e.rid,
      e.scriptureRef,
      e.claim,
      e.corroboration,
      e.notes || '',
    )
  }
  console.log(`  ✓ evidence_fts: ${evidenceRows.length} records`)

  // Test
  const testVerses = await db.$queryRawUnsafe<any[]>(
    `SELECT snippet(verses_fts, 1, '<mark>', '</mark>', '...', 12) as highlight FROM verses_fts WHERE verses_fts MATCH ? LIMIT 3;`,
    'watchers'
  )
  console.log(`  test "watchers": ${testVerses.length} matches`)
  if (testVerses[0]) console.log(`    sample: ${testVerses[0].highlight?.slice(0, 100)}`)

  await db.$disconnect()
  console.log('✅ FTS5 setup complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
