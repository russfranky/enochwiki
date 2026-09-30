// robots.ts — generates robots.txt for enoch.wiki
// Only allows paths that resolve. /articles, /glossary, /scripture, and
// /canon have no page routes (fixed 2026-09-29).
import { MetadataRoute } from 'next'

const SITE_URL = 'https://enoch.wiki'

const PUBLIC_PATHS = ['/', '/topics', '/how-we-vet']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_PATHS,
        disallow: ['/api', '/review', '/study', '/admin'],
      },
      {
        userAgent: 'GPTBot',
        allow: PUBLIC_PATHS,
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'Google-Extended',
        allow: PUBLIC_PATHS,
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: PUBLIC_PATHS,
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: PUBLIC_PATHS,
        disallow: ['/api', '/review'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
