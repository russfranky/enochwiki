// robots.ts — generates robots.txt for enoch.wiki
import { MetadataRoute } from 'next'

const SITE_URL = 'https://enoch.wiki'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/topics', '/articles', '/glossary', '/scripture', '/canon', '/how-we-vet'],
        disallow: ['/api', '/review', '/study', '/admin'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/topics', '/articles', '/glossary'],
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/topics', '/articles', '/glossary'],
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/topics', '/articles', '/glossary'],
        disallow: ['/api', '/review'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/topics', '/articles', '/glossary'],
        disallow: ['/api', '/review'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
