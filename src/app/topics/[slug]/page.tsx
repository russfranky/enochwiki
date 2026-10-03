import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'
import { db } from '@/lib/db'
import { BookOpen, Calendar, Tag, ShieldCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const topic = await db.topicPage.findFirst({
    where: { slug, reviewState: 'approved' },
    select: { title: true, subtitle: true, seoDescription: true, seoKeywords: true },
  })
  if (!topic) return { title: 'Topic not found' }
  const keywords = topic.seoKeywords
    ?.split('|')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
  return {
    title: topic.title,
    description: topic.seoDescription || topic.subtitle || undefined,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
  }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topicPage = await db.topicPage.findFirst({
    where: { slug, reviewState: 'approved' },
    include: {
      publicArticles: {
        where: { reviewState: 'approved' },
        include: { perspectiveLinks: { include: { perspective: true } } },
      },
    },
  })
  if (!topicPage) notFound()

  const perspectives = new Set<string>()
  topicPage.publicArticles.forEach((a: any) => {
    a.perspectiveLinks.forEach((p: any) => perspectives.add(p.perspective.slug))
  })
  const canonicalCount = topicPage.canonicalRefs ? topicPage.canonicalRefs.split('|').length : 0

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-ui-stack)' }}>
          <Link href="/topics" className="hover:text-foreground">Topics</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground break-words">{topicPage.title}</span>
        </nav>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="text-[10px] tag-historically-corroborated">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
          {perspectives.size > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <Tag className="h-3 w-3 mr-1" />
              {perspectives.size} perspectives
            </Badge>
          )}
          {canonicalCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <BookOpen className="h-3 w-3 mr-1" />
              {canonicalCount} scripture refs
            </Badge>
          )}
          {topicPage.publishedAt && (
            <Badge variant="outline" className="text-[10px]">
              <Calendar className="h-3 w-3 mr-1" />
              Published {new Date(topicPage.publishedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2 break-words">{topicPage.title}</h1>
        {topicPage.subtitle && (
          <p className="text-lg text-muted-foreground mb-6 italic">{topicPage.subtitle}</p>
        )}

        {topicPage.filmRelevance?.trim() && (
          <Card className="p-3 sm:p-4 mb-6 bg-accent/5 border-accent/30">
            <div className="text-[10px] uppercase tracking-wider text-accent-strong font-semibold mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Film relevance
            </div>
            <p className="text-sm">{topicPage.filmRelevance}</p>
          </Card>
        )}

        <div className="prose-enoch">
          <ReactMarkdown>{topicPage.bodyMarkdown}</ReactMarkdown>
        </div>

        {topicPage.publicArticles.length > 0 && (
          <>
            <Separator className="my-8" />
            <h2 className="font-serif text-xl font-semibold mb-4">Related articles</h2>
            <div className="space-y-2.5">
              {topicPage.publicArticles.map((a: any) => (
                <Card key={a.id} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-serif font-medium text-sm">{a.title}</h3>
                    {a.claimTypeSlug && (
                      <Badge variant="outline" className="text-[9px] flex-shrink-0">{a.claimTypeSlug}</Badge>
                    )}
                  </div>
                  {a.subtitle && <p className="text-xs text-muted-foreground">{a.subtitle}</p>}
                  <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>Corroboration: {Math.min(100, Math.max(0, a.corroborationScore * 100)).toFixed(0)}%</span>
                    <span>Sources: {a.sourcesCount}</span>
                    <span>Perspectives: {a.perspectiveLinks.length}</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      <footer className="mt-auto border-t border-hairline bg-card/60 px-3 sm:px-4 md:px-6 py-2.5 text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span style={{ fontFamily: 'var(--font-read-stack)' }} className="italic hidden sm:inline">
            &ldquo;Pursue truth at all costs, carry no bias.&rdquo;
          </span>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px]" style={{ fontFamily: 'var(--font-ui-stack)' }}>
            <Link href="/how-we-vet" className="hover:text-foreground py-1">How we vet content</Link>
            <span>·</span>
            <span className="font-semibold text-foreground">enoch.wiki</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
