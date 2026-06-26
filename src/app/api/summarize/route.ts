// AI passage summary — grounded in the local corpus
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bookSlug, chapterNum } = body as { bookSlug: string; chapterNum: number }

  if (!bookSlug || !chapterNum) {
    return NextResponse.json({ error: 'bookSlug and chapterNum required' }, { status: 400 })
  }

  const book = await db.book.findUnique({ where: { slug: bookSlug } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const chapter = await db.chapter.findFirst({
    where: { bookId: book.id, number: chapterNum },
    include: { verses: { orderBy: { verseNum: 'asc' } } },
  })
  if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const versesText = chapter.verses
    .map((v) => `${v.chapterNum}:${v.verseNum} — ${v.text}`)
    .join('\n')

  // Retrieve cross-references for this chapter
  const chapterRefPrefix = `${bookSlug} ${chapterNum}:`
  const crossRefs = await db.crossReference.findMany({
    where: { OR: [{ sourceRef: { startsWith: chapterRefPrefix } }, { targetRef: { startsWith: chapterRefPrefix } }] },
    take: 10,
    orderBy: { confidence: 'desc' },
  })

  // Retrieve evidence for this chapter
  const evidence = await db.evidence.findMany({
    where: { scriptureRef: { startsWith: chapterRefPrefix } },
    take: 5,
    include: { source: true },
    orderBy: { confidence: 'desc' },
  })

  const systemPrompt = `You are the AI study companion for Enoch.Wiki (https://enoch.wiki) — a rigorously corroborated knowledge resource for the Ethiopian Orthodox Bible. Produce a structured summary of the chapter the user is reading.

## Chapter Content
**${book.name} — Chapter ${chapter.number}${chapter.title ? `: ${chapter.title}` : ''}**

${versesText}

## Cross-References Found
${crossRefs.length > 0 ? crossRefs.map((cr) => `- ${cr.sourceRef} ${cr.relationship} ${cr.targetRef} (${(cr.confidence * 100).toFixed(0)}% confidence)${cr.note ? ` — ${cr.note}` : ''}`).join('\n') : 'None yet in the database.'}

## External Evidence Found
${evidence.length > 0 ? evidence.map((e) => `- ${e.scriptureRef}: ${e.alignment} (${e.source?.title || 'unknown source'}, ${e.source?.credibilityTier})`).join('\n') : 'None yet in the database.'}

## Your Task

Produce a structured Markdown summary with these sections:

## Context
Where this chapter sits in the book and in the broader tradition. (~80-120 words)

## Key Claims
A numbered list of the most significant claims the chapter makes, each labeled as:
- **[Text]** — what the verse says
- **[Scholarship]** — what scholars say about this
- **[Interpretation]** — how a tradition reads it

## Parallels
Cross-references and parallels in other scripture (cite specifically).

## Contested Points
Where traditions or scholars disagree. Be honest about uncertainty.

## For Your Reflection
2-3 questions for personal contemplation.

## Grounding Rules
- Cite every claim with a specific verse reference (e.g. 1 Enoch 6:2).
- Never fabricate.
- Distinguish text from scholarship from interpretation.`

  const zai = await ZAI.create()
  let completion
  try {
    completion = await zai.chat.completions.create({
      model: 'glm-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please summarize ${book.name} chapter ${chapter.number}.` },
      ],
      thinking: { type: 'enabled' },
    } as any)
  } catch (apiErr: any) {
    const errMsg = apiErr?.message || String(apiErr)
    if (errMsg.includes('1113') || errMsg.includes('Insufficient balance') || errMsg.includes('429')) {
      return NextResponse.json({
        error: 'Z.ai API has insufficient balance. Add credits at https://z.ai/ to generate summaries.',
      }, { status: 503 })
    }
    throw apiErr
  }

  const summary = completion?.choices?.[0]?.message?.content ?? 'No summary generated. The Z.ai API may be unavailable or out of balance.'

  // Persist the summary on the chapter
  await db.chapter.update({
    where: { id: chapter.id },
    data: { summary },
  })

  return NextResponse.json({
    bookSlug,
    chapterNum,
    summary,
    crossRefs,
    evidence: evidence.map((e) => ({
      id: e.id,
      scriptureRef: e.scriptureRef,
      claim: e.claim,
      corroboration: e.corroboration,
      alignment: e.alignment,
      confidence: e.confidence,
      source: e.source ? { title: e.source.title, url: e.source.url, domain: e.source.domain } : null,
    })),
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookSlug = searchParams.get('book')
  const chapterNum = searchParams.get('chapter')
  if (!bookSlug || !chapterNum) {
    return NextResponse.json({ error: 'book and chapter required' }, { status: 400 })
  }
  const book = await db.book.findUnique({ where: { slug: bookSlug } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  const chapter = await db.chapter.findFirst({
    where: { bookId: book.id, number: parseInt(chapterNum, 10) },
  })
  if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  return NextResponse.json({ summary: chapter.summary, hasSummary: !!chapter.summary })
}
