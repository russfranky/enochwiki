// Paint the picture + expose the gaps. Generates docs/coverage-map.md: a living
// map of what evidence exists, filed by verifiability level, per topic — and
// where the holes are. The point is transparency, not a verdict: every piece is
// shown at its level so readers/explorers can weigh the whole composition.
//
//   node --env-file=.env scripts/coverage-map.mjs

import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'node:fs'
const db = new PrismaClient()

const LADDER = [
  ['textually-attested', 'Textually attested'],
  ['historically-corroborated', 'Historically / archaeologically corroborated'],
  ['scholarly-consensus', 'Scholarly consensus'],
  ['contested-minority', 'Contested / minority'],
  ['tradition-devotional', 'Tradition / devotional'],
  ['visionary-private-revelation', 'Visionary / private revelation'],
  ['speculative', 'Speculative'],
]
const SOLID = new Set(['textually-attested', 'historically-corroborated', 'scholarly-consensus'])
const bar = (n, max, w = 24) => '█'.repeat(Math.round((n / Math.max(max, 1)) * w)) + '·'.repeat(w - Math.round((n / Math.max(max, 1)) * w))

const evidences = await db.evidence.findMany({ include: { source: true } })
const sources = await db.source.count()
const leads = await db.source.count({ where: { credibilityTier: 'community-lead' } })

// Overall ladder
const overall = {}
for (const ev of evidences) overall[ev.claimTypeSlug || 'unfiled'] = (overall[ev.claimTypeSlug || 'unfiled'] || 0) + 1
const maxOverall = Math.max(...Object.values(overall), 1)

// Group by topic (the scrape label lives on source.keywords).
const topics = {}
for (const ev of evidences) {
  const label = ev.source?.keywords || 'unlabelled'
  ;(topics[label] ||= []).push(ev)
}
const topicRows = Object.entries(topics).map(([label, evs]) => {
  const counts = {}
  for (const ev of evs) counts[ev.claimTypeSlug || 'unfiled'] = (counts[ev.claimTypeSlug || 'unfiled'] || 0) + 1
  const solid = evs.filter((e) => SOLID.has(e.claimTypeSlug)).length
  return { label, total: evs.length, counts, solid, gap: solid === 0 }
}).sort((a, b) => a.solid - b.solid || b.total - a.total)

// Scripture coverage by book.
const books = await db.book.findMany({ include: { verses: true } })
const evByRef = new Set(evidences.map((e) => e.scriptureRef))
const bookRows = []
for (const b of books) {
  const withEv = b.verses.filter((v) => evByRef.has(`${b.slug} ${v.chapterNum}:${v.verseNum}`)).length
  bookRows.push({ name: b.name, verses: b.verses.length, withEv })
}

// ── Render ───────────────────────────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 10)
let md = `# enoch.wiki — Verifiability Coverage Map\n\n`
md += `> Auto-generated ${now} by \`scripts/coverage-map.mjs\`. **Not a verdict — a filing system.**\n`
md += `> Every fragment is shown at its honest level of verifiability so explorers can weigh the\n`
md += `> whole composition and decide for themselves. Lower on the ladder ≠ false; it means *less\n`
md += `> independently verifiable* and a place to keep digging.\n\n`
md += `**${evidences.length} evidence** across **${sources} sources** (${leads} community-leads) · **${topicRows.length} topics**\n\n`

md += `## The picture so far — verifiability ladder\n\n`
md += `| Level | Count | |\n|---|---:|---|\n`
for (const [slug, name] of LADDER) md += `| ${name} | ${overall[slug] || 0} | \`${bar(overall[slug] || 0, maxOverall)}\` |\n`
if (overall.unfiled) md += `| _(unfiled)_ | ${overall.unfiled} | |\n`

md += `\n## By topic — where each thread stands\n\n`
md += `\`solid\` = textually-attested + corroborated + scholarly-consensus. A topic with 0 solid is a **gap** to peel back.\n\n`
md += `| Topic | Solid | Total | Breakdown |\n|---|---:|---:|---|\n`
for (const t of topicRows) {
  const bd = LADDER.filter(([s]) => t.counts[s]).map(([s, n]) => `${n.split(' ')[0].toLowerCase()}:${t.counts[s]}`).join(' · ')
  md += `| ${t.gap ? '⚠️ ' : ''}${t.label} | ${t.solid} | ${t.total} | ${bd} |\n`
}

md += `\n## Scripture coverage\n\n| Book | Verses | With evidence | Coverage |\n|---|---:|---:|---:|\n`
for (const b of bookRows) md += `| ${b.name} | ${b.verses} | ${b.withEv} | ${b.verses ? Math.round((b.withEv / b.verses) * 100) : 0}% |\n`

md += `\n## Gaps to peel back next\n\nTopics currently resting only on devotional / visionary / speculative / lead sources — prime targets for deeper digging and corroboration:\n\n`
const gaps = topicRows.filter((t) => t.gap)
md += gaps.length ? gaps.map((t) => `- **${t.label}** (${t.total} pieces, none independently corroborated yet)`).join('\n') : '_None — every topic has at least one solid source._'
md += `\n`

mkdirSync('docs', { recursive: true })
writeFileSync('docs/coverage-map.md', md)
console.error(`[coverage-map] wrote docs/coverage-map.md — ${topicRows.length} topics, ${gaps.length} gaps, ${evidences.length} evidence`)
await db.$disconnect()
