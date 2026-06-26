// Public site content — topic pages, approved articles, transparency page
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const topic = searchParams.get('topic')
  const list = searchParams.get('list')

  // List all published topic pages
  if (list === 'topics') {
    const topics = await db.topicPage.findMany({
      where: { reviewState: 'approved' },
      orderBy: { title: 'asc' },
      select: {
        slug: true,
        title: true,
        subtitle: true,
        seoDescription: true,
        filmRelevance: true,
        publishedAt: true,
      },
    })
    return NextResponse.json({ topics })
  }

  // List all approved articles (with optional topic filter)
  if (list === 'articles') {
    const articles = await db.publicArticle.findMany({
      where: {
        reviewState: 'approved',
        ...(topic ? { topicPage: { slug: topic } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        seoDescription: true,
        corroborationScore: true,
        confidenceScore: true,
        sourcesCount: true,
        perspectivesCount: true,
        publishedAt: true,
        claimTypeSlug: true,
      },
    })
    return NextResponse.json({ articles })
  }

  // Get a specific topic page with its articles
  if (slug) {
    // Gate the topic page itself on approval — a draft/rejected/archived page must
    // not leak its bodyMarkdown to the public endpoint, only its approved articles.
    const topicPage = await db.topicPage.findFirst({
      where: { slug, reviewState: 'approved' },
      include: {
        publicArticles: {
          where: { reviewState: 'approved' },
          include: { perspectiveLinks: { include: { perspective: true } } },
        },
      },
    })
    if (!topicPage) return NextResponse.json({ error: 'Topic page not found' }, { status: 404 })

    // Compute perspective spread
    const allPerspectives = new Set<string>()
    topicPage.publicArticles.forEach((a) => {
      a.perspectiveLinks.forEach((p) => allPerspectives.add(p.perspective.slug))
    })

    return NextResponse.json({
      topicPage: {
        slug: topicPage.slug,
        title: topicPage.title,
        subtitle: topicPage.subtitle,
        seoDescription: topicPage.seoDescription,
        bodyMarkdown: topicPage.bodyMarkdown,
        filmRelevance: topicPage.filmRelevance,
        canonicalRefs: topicPage.canonicalRefs,
        reviewState: topicPage.reviewState,
        publishedAt: topicPage.publishedAt,
        articles: topicPage.publicArticles.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          subtitle: a.subtitle,
          corroborationScore: a.corroborationScore,
          confidenceScore: a.confidenceScore,
          sourcesCount: a.sourcesCount,
          perspectivesCount: a.perspectivesCount,
          claimTypeSlug: a.claimTypeSlug,
          perspectives: a.perspectiveLinks.map((p) => p.perspective.slug),
        })),
        perspectiveSpread: Array.from(allPerspectives),
      },
    })
  }

  // Default: return transparency / "how we vet" page data
  return NextResponse.json({
    transparency: {
      title: 'How We Vet',
      perspectiveTags: await db.perspectiveTag.findMany({ orderBy: { name: 'asc' } }),
      claimTypes: await db.claimType.findMany({ orderBy: { name: 'asc' } }),
      credibilityTiers: [
        { slug: 'peer-reviewed', name: 'Peer-Reviewed / Academic', description: 'Peer-reviewed journals, university presses, scholarly monographs.' },
        { slug: 'reputable-reference', name: 'Reputable Reference', description: 'Established encyclopedias, museum collections, reputable reference works (e.g. Brill, Oxford, Cambridge).' },
        { slug: 'popular-journalistic', name: 'Popular / Journalistic', description: 'Reputable journalism and popular reference (e.g. Biblical Archaeology Society, Smithsonian).' },
        { slug: 'self-published', name: 'Self-Published / Forum', description: 'Blogs, forums, YouTube, self-published books. Surfaced only with explicit flagging.' },
      ],
      reviewStates: [
        { slug: 'draft', name: 'Draft' },
        { slug: 'auto-corroborated', name: 'Auto-Corroborated' },
        { slug: 'in-review', name: 'In Editorial Review' },
        { slug: 'approved', name: 'Approved / Published' },
        { slug: 'rejected', name: 'Rejected' },
        { slug: 'needs-revision', name: 'Needs Revision' },
        { slug: 'archived', name: 'Archived' },
      ],
      reviewRubric: [
        'Sources cited and retrievable',
        'Minimum credibility tier met (reputable-reference or higher for authoritative claims)',
        'Claim type labeled',
        'Perspectives represented (no single-source claims unless explicitly flagged)',
        'No fabricated citations',
        'Contested/sensitive claims flagged and contextualized',
        'Authority not overstated',
      ],
    },
  })
}
