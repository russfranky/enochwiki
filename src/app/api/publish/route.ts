// One-way publish path: private → public
// Takes an approved item and creates/updates a corresponding PublicArticle
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { itemType, itemId } = body as { itemType: string; itemId: string }

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId required' }, { status: 400 })
  }

  // Verify the item is approved
  let approved = false
  let slug: string
  let title: string
  let bodyMarkdown: string
  let subtitle: string | undefined
  let seoDescription: string | undefined
  let seoKeywords: string | undefined
  let claimTypeSlug: string | undefined
  let perspectives: string[] = []
  let canonicalRefs: string | undefined

  if (itemType === 'evidence') {
    const ev = await db.evidence.findUnique({
      where: { id: itemId },
      include: { source: true, perspectiveLinks: { include: { perspective: true } } },
    })
    if (!ev) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (ev.reviewState !== 'approved') {
      return NextResponse.json({ error: 'Item must be approved before publishing' }, { status: 400 })
    }
    approved = true
    slug = `evidence-${ev.id.slice(-8)}`
    title = `Evidence: ${ev.scriptureRef} — ${ev.alignment}`
    subtitle = ev.source?.title
    bodyMarkdown = [
      `# ${title}`,
      '',
      `## Scripture Reference`,
      `**${ev.scriptureRef}**`,
      ev.scriptureText ? `\n> ${ev.scriptureText}` : '',
      '',
      `## Claim`,
      ev.claim,
      '',
      `## Corroboration`,
      ev.corroboration,
      '',
      `## Source`,
      ev.source ? `[${ev.source.title}](${ev.source.url})` : 'Unknown',
      ev.source ? `- Domain: ${ev.source.domain}` : '',
      ev.source ? `- Category: ${ev.source.category}` : '',
      ev.source ? `- Credibility tier: ${ev.source.credibilityTier}` : '',
      ev.source ? `- Credibility score: ${(ev.source.credibility * 100).toFixed(0)}%` : '',
      '',
      ev.notes ? `## Notes\n${ev.notes}` : '',
    ].filter(Boolean).join('\n')
    seoDescription = `${ev.scriptureRef}: ${ev.claim.slice(0, 140)}`
    seoKeywords = `${ev.scriptureRef.replace(/[:\s]/g, '-')}|${ev.alignment}|${ev.source?.category || 'evidence'}`
    claimTypeSlug = ev.claimTypeSlug || undefined
    perspectives = ev.perspectiveLinks.map((p) => p.perspectiveId)
    canonicalRefs = ev.scriptureRef
  } else if (itemType === 'topic-page') {
    const tp = await db.topicPage.findUnique({ where: { id: itemId } })
    if (!tp) return NextResponse.json({ error: 'Topic page not found' }, { status: 404 })
    if (tp.reviewState !== 'approved') {
      return NextResponse.json({ error: 'Topic page must be approved before publishing' }, { status: 400 })
    }
    approved = true
    slug = tp.slug
    title = tp.title
    subtitle = tp.subtitle || undefined
    bodyMarkdown = tp.bodyMarkdown
    seoDescription = tp.seoDescription || undefined
    seoKeywords = tp.seoKeywords || undefined
    canonicalRefs = tp.canonicalRefs || undefined
  } else {
    return NextResponse.json({ error: 'Unsupported itemType for publish' }, { status: 400 })
  }

  if (!approved) {
    return NextResponse.json({ error: 'Item not approved' }, { status: 400 })
  }

  // Upsert PublicArticle
  const existing = await db.publicArticle.findUnique({ where: { slug } })
  let article
  if (existing) {
    article = await db.publicArticle.update({
      where: { slug },
      data: {
        title,
        subtitle,
        bodyMarkdown,
        seoDescription,
        seoKeywords,
        claimTypeSlug: claimTypeSlug || null,
        publishedAt: new Date(),
        reviewState: 'approved',
      },
    })
  } else {
    article = await db.publicArticle.create({
      data: {
        slug,
        title,
        subtitle,
        bodyMarkdown,
        seoDescription,
        seoKeywords,
        claimTypeSlug: claimTypeSlug || null,
        publishedAt: new Date(),
        reviewState: 'approved',
        corroborationScore: 0.5, // computed later
        confidenceScore: 0.5,
        sourcesCount: 1,
        perspectivesCount: perspectives.length,
      },
    })
  }

  // Sync perspective links
  if (perspectives.length > 0) {
    await db.publicArticlePerspective.deleteMany({ where: { articleId: article.id } })
    for (const pId of perspectives) {
      await db.publicArticlePerspective.create({
        data: { articleId: article.id, perspectiveId: pId, weight: 1.0 },
      })
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      action: 'publish',
      itemType,
      itemId,
      actor: 'publisher',
      actorRole: 'publisher',
      details: JSON.stringify({ articleSlug: article.slug, articleId: article.id }),
    },
  })

  return NextResponse.json({
    published: true,
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      publishedAt: article.publishedAt,
    },
  })
}
