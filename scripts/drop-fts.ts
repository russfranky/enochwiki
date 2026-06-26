// Drop all FTS5 tables so Prisma can push schema cleanly
import { db } from '../src/lib/db'

async function main() {
  console.log('🧹 Dropping FTS5 tables...')

  // Drop triggers
  for (const t of ['verses_ai', 'verses_ad', 'verses_au', 'sources_ai', 'sources_ad', 'sources_au', 'evidence_ai', 'evidence_ad', 'evidence_au']) {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${t};`).catch(() => {})
  }

  // Drop FTS tables (and their shadow tables will be dropped automatically)
  for (const t of ['verses_fts', 'sources_fts', 'evidence_fts']) {
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS ${t};`).catch(() => {})
    // Also drop shadow tables if they exist
    for (const suffix of ['_config', '_data', '_docsize', '_idx']) {
      await db.$executeRawUnsafe(`DROP TABLE IF EXISTS ${t}${suffix};`).catch(() => {})
    }
  }

  console.log('✅ FTS5 tables dropped. Now run db:push.')
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
