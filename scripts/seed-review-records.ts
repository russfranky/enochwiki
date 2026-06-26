// Seed ReviewRecords for existing content (evidence + topic pages)
import { db } from '../src/lib/db'

async function main() {
  console.log('📝 Creating ReviewRecords for existing content...')

  // Topic pages — all start in 'draft'
  const topics = await db.topicPage.findMany()
  for (const t of topics) {
    const existing = await db.reviewRecord.findFirst({ where: { itemType: 'topic-page', itemId: t.id } })
    if (existing) continue
    await db.reviewRecord.create({
      data: {
        itemType: 'topic-page',
        itemId: t.id,
        state: 'draft',
        reviewer: 'seed',
        reviewerRole: 'contributor',
        version: 1,
        notes: 'Initial draft from topic-page seed.',
      },
    })
  }
  console.log(`  ✓ ${topics.length} topic pages → review records`)

  // Evidence — all start as 'auto-corroborated' (they came from the curated seed)
  const evidence = await db.evidence.findMany()
  for (const e of evidence) {
    const existing = await db.reviewRecord.findFirst({ where: { itemType: 'evidence', itemId: e.id } })
    if (existing) continue
    // Update evidence state to 'auto-corroborated'
    await db.evidence.update({
      where: { id: e.id },
      data: { reviewState: 'auto-corroborated' },
    })
    await db.reviewRecord.create({
      data: {
        itemType: 'evidence',
        itemId: e.id,
        state: 'auto-corroborated',
        reviewer: 'seed',
        reviewerRole: 'contributor',
        version: 1,
        notes: 'Pre-baked corroboration from initial seed.',
      },
    })
  }
  console.log(`  ✓ ${evidence.length} evidence → review records`)

  console.log('📝 Done.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await db.$disconnect() })
