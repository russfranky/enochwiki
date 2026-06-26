// Daily insight — passage + parallels + reflection, rotated daily
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if today's insight already exists
  let insight = await db.dailyInsight.findUnique({ where: { date: today } })
  if (insight) {
    return NextResponse.json({ insight })
  }

  // Otherwise: pick a verse deterministically based on day-of-year
  const verses = await db.verse.findMany({
    take: 200,
    include: { book: true, chapter: true, themeLinks: { include: { theme: true } } },
  })
  if (verses.length === 0) {
    return NextResponse.json({ error: 'No verses in corpus' }, { status: 500 })
  }

  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const verse = verses[dayOfYear % verses.length]
  const ref = `${verse.book.slug} ${verse.chapter.number}:${verse.verseNum}`

  // Find parallel verses via cross-references
  const crossRefs = await db.crossReference.findMany({
    where: { OR: [{ sourceRef: ref }, { targetRef: ref }] },
    take: 3,
    orderBy: { confidence: 'desc' },
  })

  const parallels = crossRefs.map((cr) => ({
    ref: cr.sourceRef === ref ? cr.targetRef : cr.sourceRef,
    note: cr.note,
  }))

  // Pick a life theme based on the verse's themes
  const themes = verse.themeLinks.map((tl) => tl.theme)
  const lifeTheme = themes[0]?.name || 'Wisdom'

  const reflection = `Today's passage from ${verse.book.name} ${verse.chapter.number}:${verse.verseNum} invites reflection on ${themes[0]?.name || 'the sacred'}. ` +
    (crossRefs.length > 0
      ? `It echoes ${parallels.map((p) => p.ref).join(', ')} — a thread woven through scripture. `
      : '') +
    `Sit with this text. What is it asking of you today? What pattern does it reveal about the nature of reality and your place within it?`

  insight = await db.dailyInsight.create({
    data: {
      date: today,
      scriptureRef: ref,
      scriptureText: verse.text,
      themeSlug: themes[0]?.slug,
      parallels: JSON.stringify(parallels),
      reflection,
      lifeTheme,
      reviewState: 'draft',
    },
  })

  return NextResponse.json({ insight })
}
