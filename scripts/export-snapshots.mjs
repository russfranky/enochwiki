// Write the durable corpus snapshots (sources+evidence, authorities) that survive
// container churn and seed fresh checkouts. Used after any scrape/crawl/validate.
//   node --env-file=.env scripts/export-snapshots.mjs
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'node:fs'
const db = new PrismaClient()

const [s, e, r] = await Promise.all([db.source.count(), db.evidence.count(), db.reviewRecord.count()])
const sources = await db.source.findMany({ include: { evidences: true } })
writeFileSync('data/corroboration-export.json', JSON.stringify({ exportedAt: new Date().toISOString(), counts: { sources: s, evidence: e, reviews: r }, sources }, null, 2))

const authorities = await db.authority.findMany({ include: { sourceLinks: true } })
writeFileSync('data/authorities-export.json', JSON.stringify({ exportedAt: new Date().toISOString(), count: authorities.length, authorities }, null, 2))

console.error(`[export-snapshots] ${sources.length} sources, ${e} evidence, ${authorities.length} authorities`)
await db.$disconnect()
