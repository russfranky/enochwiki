import { db } from '../src/lib/db'
async function main() {
  const p = await db.perspectiveTag.findMany()
  console.log('perspectives:', p.length)
  const c = await db.claimType.findMany()
  console.log('claim types:', c.length)
  const g = await db.glossaryEntry.findMany()
  console.log('glossary:', g.length)
  const r = await db.reviewRecord.findMany()
  console.log('review records:', r.length)
  await db.$disconnect()
}
main().catch(e => { console.error('ERR', e); process.exit(1) })
