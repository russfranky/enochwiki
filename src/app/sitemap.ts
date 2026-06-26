// sitemap.ts — generates sitemap.xml for enoch.wiki
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://enoch.wiki'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/how-we-vet`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/canon`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/glossary`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Add all approved topic pages
  try {
    const topics = await db.topicPage.findMany({
      where: { reviewState: 'approved' },
      orderBy: { updatedAt: 'desc' },
    })
    for (const t of topics) {
      entries.push({
        url: `${SITE_URL}/topics/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }

    // Add all approved public articles
    const articles = await db.publicArticle.findMany({
      where: { reviewState: 'approved' },
      orderBy: { updatedAt: 'desc' },
    })
    for (const a of articles) {
      entries.push({
        url: `${SITE_URL}/articles/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    // Add glossary entries
    const glossary = await db.glossaryEntry.findMany()
    for (const g of glossary) {
      entries.push({
        url: `${SITE_URL}/glossary/${encodeURIComponent(g.term.toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: g.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    // Add books
    const books = await db.book.findMany({ orderBy: { order: 'asc' } })
    for (const b of books) {
      entries.push({
        url: `${SITE_URL}/scripture/${b.slug}`,
        lastModified: b.createdAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (e) {
    // DB not ready — return static entries only
  }

  return entries
}
