// sitemap.ts: generates sitemap.xml for enoch.wiki
// Only lists URLs that resolve. /canon, /glossary, /articles/*, and
// /scripture/* have no page routes, so advertising them sends crawlers
// into 404s (fixed 2026-09-29).
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://enoch.wiki'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static and book entries carry no lastModified: there is no stored
  // modification date for them, and stamping the request instant made
  // every date false (SEO audit, 2026-11-23). Topic entries below use
  // their real updatedAt. Omit a date rather than fabricate one.
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/read`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/topics`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/how-we-vet`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/books`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/resurrection-of-the-christ`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Add all book pages
  try {
    const { BOOKS } = await import('@/lib/books')
    for (const b of BOOKS) {
      entries.push({
        url: `${SITE_URL}/books/${b.slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch (e) {
    // Books lib failed to load: skip, but log it. A silent catch here
    // once made a broken sitemap indistinguishable from an empty one.
    console.error('[sitemap] failed to load books for sitemap:', e)
  }

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
    // DB query failed: return static entries only, but log it. A silent
    // catch here made "no approved topics" and "database down" look
    // identical from outside (SEO audit, 2026-11-23).
    console.error('[sitemap] failed to load topic pages for sitemap:', e)
  }

  // Add all scripture book indexes and chapter pages (SEO Phase 2,
  // cycle 6). No lastModified: Chapter has no updatedAt field, and
  // stamping the request instant would fabricate dates.
  try {
    const books = await db.book.findMany({
      orderBy: { order: 'asc' },
      include: { chapters: { orderBy: { number: 'asc' } } },
    })
    for (const b of books) {
      entries.push({
        url: `${SITE_URL}/read/${b.slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
      for (const c of b.chapters) {
        entries.push({
          url: `${SITE_URL}/read/${b.slug}/${c.number}`,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch (e) {
    console.error('[sitemap] failed to load scripture chapters for sitemap:', e)
  }

  return entries
}
