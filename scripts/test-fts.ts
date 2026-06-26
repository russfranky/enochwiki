// Test FTS queries directly
import { db } from '../src/lib/db'

async function main() {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT v.id, v.text FROM verses_fts JOIN Verse v ON v.rowid = verses_fts.rowid WHERE verses_fts MATCH ? LIMIT 5`,
      '"watchers"'
    )
    console.log('FTS verses result:', rows.length)
  } catch (e: any) {
    console.error('FTS verses error:', e.message)
  }
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT s.id, s.title FROM sources_fts JOIN Source s ON s.rowid = sources_fts.rowid WHERE sources_fts MATCH ? LIMIT 5`,
      '"watchers"'
    )
    console.log('FTS sources result:', rows.length)
  } catch (e: any) {
    console.error('FTS sources error:', e.message)
  }
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT e.id FROM evidence_fts JOIN Evidence e ON e.rowid = evidence_fts.rowid WHERE evidence_fts MATCH ? LIMIT 5`,
      '"watchers"'
    )
    console.log('FTS evidence result:', rows.length)
  } catch (e: any) {
    console.error('FTS evidence error:', e.message)
  }
  await db.$disconnect()
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
