// sitemap.ts — generates sitemap.xml for enoch.wiki
// Only lists URLs that resolve. /canon, /glossary, /articles/*, and
// /scripture/* have no page routes, so advertising them sends crawlers
// into 404s (fixed 2026-09-29).
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
  } catch (e) {
    // DB not ready — return static entries only
  }

  return entries
}
