// Scrape external sources to corroborate scripture — uses direct Z.ai API (web_search + page_reader)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 90

// Credibility heuristics by domain
const DOMAIN_CREDIBILITY: Record<string, number> = {
  'deadseascrolls.org.il': 0.98,
  'britishmuseum.org': 0.97,
  'metmuseum.org': 0.95,
  'louvre.fr': 0.95,
  'smithsonianmag.com': 0.85,
  'nature.com': 0.95,
  'science.org': 0.95,
  'sciencedirect.com': 0.9,
  'jstor.org': 0.92,
  'academia.edu': 0.7,
  'cambridge.org': 0.92,
  'oxfordacademic.com': 0.92,
  'brill.com': 0.92,
  'biblicalarchaeology.org': 0.9,
  'asor.org': 0.88,
  'bibleinterp.com': 0.85,
  'livescience.com': 0.75,
  'haaretz.com': 0.7,
  'israelantiquities.org': 0.92,
  'wikipedia.org': 0.65, // useful, but tertiary
}

const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: 'archaeology', keywords: ['excavation', 'qumran', 'scrolls', 'tel', 'stratum', 'pottery', 'ostracon', 'seal', 'inscription'] },
  { category: 'academic', keywords: ['journal', 'peer-reviewed', 'ph.d', 'university press', 'jstor', 'doi', 'professor'] },
  { category: 'science', keywords: ['radiocarbon', 'geology', 'genetics', 'cosmology', 'paleoclimate', 'isotope', 'c-14'] },
  { category: 'museum', keywords: ['collection', 'exhibit', 'accession', 'gallery', 'artifact'] },
  { category: 'history', keywords: ['chronicle', 'annals', 'antiquity', 'empire', 'dynasty', 'inscription'] },
]

function scoreCredibility(domain: string, snippet: string): number {
  const base = DOMAIN_CREDIBILITY[domain] ?? 0.55
  // bonus for keyword presence
  const lower = snippet.toLowerCase()
  let bonus = 0
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const k of keywords) {
      if (lower.includes(k)) bonus = Math.max(bonus, 0.05)
    }
  }
  // penalty for known low-quality
  if (domain.includes('blog') || domain.includes('forum')) return Math.min(base - 0.15, 0.4)
  return Math.min(base + bonus, 0.99)
}

function categorize(domain: string, snippet: string): string {
  const lower = (domain + ' ' + snippet).toLowerCase()
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return category
  }
  if (DOMAIN_CREDIBILITY[domain] !== undefined) {
    if (domain.includes('museum')) return 'museum'
    if (domain.includes('nature') || domain.includes('science')) return 'science'
  }
  return 'history'
}

function deriveCredibilityTier(credibility: number): string {
  if (credibility >= 0.9) return 'peer-reviewed'
  if (credibility >= 0.75) return 'reputable-reference'
  if (credibility >= 0.55) return 'popular-journalistic'
  return 'self-published'
}

function extractKeywords(query: string): string {
  // crude keyword extraction: drop stopwords, keep nouns
  const stop = new Set(['the', 'and', 'of', 'in', 'a', 'to', 'is', 'was', 'were', 'for', 'on', 'at', 'by', 'with', 'from', 'as', 'an', 'it', 'that', 'this', 'these', 'those', 'be', 'are', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'any', 'because', 'before', 'below', 'between', 'both', 'but', 'each', 'few', 'more', 'most', 'other', 'our', 'out', 'own', 'same', 'she', 'he', 'they', 'them', 'their', 'we', 'us', 'our', 'your', 'yours', 'its', 'it', 'her', 'his', 'him', 'i', 'me', 'my', 'mine'])
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w))
  return Array.from(new Set(words)).slice(0, 8).join('|')
}

interface ScrapeRequestBody {
  query: string
  scriptureRef?: string
  scriptureText?: string
  num?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScrapeRequestBody
    const { query, scriptureRef, scriptureText, num = 8 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Use the direct Z.ai API utility (handles /v4/tools + /v4/web_search + SDK fallback)
    const { webSearch, pageReader } = await import('@/lib/zai-api')

    let searchResults: any[]
    try {
      searchResults = await webSearch(
        `${query} archaeology OR evidence OR scholarly OR Dead Sea Scrolls OR museum`,
        num,
      )
    } catch (searchErr: any) {
      const msg = searchErr?.message || 'Search failed'
      if (msg.includes('Insufficient balance') || msg.includes('1113')) {
        return NextResponse.json({
          error: 'Z.ai API has insufficient balance. Add credits at https://z.ai/ to enable web scraping.',
          query,
        }, { status: 503 })
      }
      return NextResponse.json({
        error: `Web search failed: ${msg}`,
        query,
      }, { status: 502 })
    }

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return NextResponse.json(
        { error: 'Search returned no results', query },
        { status: 502 },
      )
    }

    // Step 2: persist each result + try to read top 3 for full content
    const saved: any[] = []
    const topResults = searchResults.slice(0, Math.min(num, 8))

    // Page-read the top 3 in parallel (heavy operation)
    const readPromises = topResults.slice(0, 3).map(async (r: any) => {
      try {
        const page = await pageReader(r.url)
        return { url: r.url, page }
      } catch (e) {
        return { url: r.url, page: null }
      }
    })
    const pageReads = await Promise.all(readPromises)
    const pageMap = new Map<string, any>()
    for (const pr of pageReads) {
      if (pr?.page?.data?.html) pageMap.set(pr.url, pr.page)
    }

    // Step 3: save each to Source table
    for (const r of topResults) {
      const url: string = r.url
      const domain = (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, '')
        } catch {
          return 'unknown'
        }
      })()
      const snippet: string = r.snippet || ''
      const credibility = scoreCredibility(domain, snippet)
      const category = categorize(domain, snippet)
      const keywords = extractKeywords(`${query} ${snippet}`)
      const publishedAt = r.date ? new Date(r.date) : null

      // Skip if already exists
      const existing = await db.source.findUnique({ where: { url } })
      if (existing) {
        saved.push({ ...existing, skipped: true })
        continue
      }

      const page = pageMap.get(url)
      let contentText: string | null = null
      let summary: string | null = snippet
      let title: string = r.name || url

      if (page?.data?.html) {
        // crude HTML → text
        const html: string = page.data.html
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 12000)
        contentText = text
        if (page.data.title) title = page.data.title
        // Build a 2-sentence summary from the text
        const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ')
        if (sentences.length > 80) summary = sentences
      }

      const created = await db.source.create({
        data: {
          url,
          title,
          domain,
          category,
          credibilityTier: deriveCredibilityTier(credibility),
          credibility,
          author: null,
          summary,
          content: contentText,
          keywords,
          publishedAt,
        },
      })

      // If the user tied this search to a specific scripture, auto-create an Evidence record
      // with auto-corroborated review state
      if (scriptureRef) {
        const ev = await db.evidence.create({
          data: {
            sourceId: created.id,
            scriptureRef,
            scriptureText: scriptureText || null,
            claim: scriptureText || `User query: ${query}`,
            corroboration: summary || snippet,
            alignment: 'contextualizes',
            confidence: credibility * 0.7,
            notes: `Auto-scraped from search: "${query}". Review and refine alignment.`,
            reviewState: 'auto-corroborated',
            blindspot: credibility < 0.6, // low-credibility sources are blindspots
          },
        })
        // Create initial ReviewRecord
        await db.reviewRecord.create({
          data: {
            itemType: 'evidence',
            itemId: ev.id,
            state: 'auto-corroborated',
            reviewer: 'scraper',
            reviewerRole: 'contributor',
            notes: `Auto-created from scrape: "${query}". Source credibility: ${(credibility * 100).toFixed(0)}%.`,
            version: 1,
          },
        })
        // Audit log
        await db.auditLog.create({
          data: {
            action: 'create',
            itemType: 'evidence',
            itemId: ev.id,
            actor: 'scraper',
            actorRole: 'contributor',
            details: JSON.stringify({ query, sourceUrl: url, credibility }),
          },
        })
      }

      saved.push({ ...created, evidences: scriptureRef ? 1 : 0 })
    }

    return NextResponse.json({
      query,
      scriptureRef: scriptureRef || null,
      found: searchResults.length,
      saved: saved.length,
      sources: saved.map((s) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        domain: s.domain,
        category: s.category,
        credibility: s.credibility,
        summary: s.summary,
        skipped: s.skipped || false,
      })),
    })
  } catch (err: any) {
    console.error('[scrape] error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Scrape failed' },
      { status: 500 },
    )
  }
}

export async function GET() {
  const sources = await db.source.findMany({
    orderBy: { retrievedAt: 'desc' },
    take: 100,
    include: { evidences: true },
  })
  return NextResponse.json({ sources })
}
