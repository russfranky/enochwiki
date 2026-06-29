// Re-seed loader for the scraped corroboration snapshot. Repopulates Source +
// Evidence + ReviewRecord rows from data/corroboration-export.json (produced by
// scripts/scrape-grow.mjs) so the live-scraped data survives a fresh container /
// new checkout without re-hitting the web. Idempotent: dedups Sources by URL.
//
//   node --env-file=.env scripts/seed-scraped.mjs

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const db = new PrismaClient()
const here = dirname(fileURLToPath(import.meta.url))
const snapshot = JSON.parse(readFileSync(join(here, '..', 'data', 'corroboration-export.json'), 'utf8'))

let addedSources = 0, addedEvidence = 0, skipped = 0
for (const s of snapshot.sources) {
  const existing = await db.source.findUnique({ where: { url: s.url } })
  if (existing) { skipped++; continue }
  const created = await db.source.create({
    data: {
      url: s.url, title: s.title, domain: s.domain, category: s.category,
      credibilityTier: s.credibilityTier, credibility: s.credibility, author: s.author ?? null,
      summary: s.summary ?? null, content: s.content ?? null, keywords: s.keywords ?? null,
      publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
    },
  })
  addedSources++
  for (const ev of s.evidences ?? []) {
    const createdEv = await db.evidence.create({
      data: {
        sourceId: created.id, scriptureRef: ev.scriptureRef, scriptureText: ev.scriptureText ?? null,
        claim: ev.claim, corroboration: ev.corroboration ?? null, alignment: ev.alignment ?? 'contextualizes',
        confidence: ev.confidence ?? null, notes: ev.notes ?? null,
        reviewState: ev.reviewState ?? 'auto-corroborated', blindspot: ev.blindspot ?? false,
      },
    })
    await db.reviewRecord.create({
      data: { itemType: 'evidence', itemId: createdEv.id, state: createdEv.reviewState, reviewer: 'seed-scraped', reviewerRole: 'contributor', notes: `Re-seeded from snapshot ${snapshot.exportedAt}`, version: 1 },
    })
    addedEvidence++
  }
}
console.error(`[seed-scraped] +sources=${addedSources} +evidence=${addedEvidence} skipped=${skipped} (from snapshot ${snapshot.exportedAt})`)
await db.$disconnect()
