import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Topics',
  description: 'Explore corroborated topics on the Ethiopian Bible: every claim sourced, perspective-tagged, and credibility-scored.',
}

export default async function TopicsIndex() {
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

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Topics</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          In-depth explorations of the concepts behind the Ethiopian Bible. Nothing here
          is published until it clears editorial review.{' '}
          <Link href="/how-we-vet" className="text-accent-strong hover:underline">See how we vet content</Link>.
        </p>

        {topics.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No topics published yet. Check back soon.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`}>
                <Card className="p-4 h-full cursor-pointer transition border-border hover:border-accent/50 hover:bg-secondary/40">
                  <div className="font-serif font-medium leading-snug mb-1 break-words">{t.title}</div>
                  {(t.subtitle || t.seoDescription) && (
                    <div className="text-xs text-muted-foreground line-clamp-3">
                      {t.subtitle || t.seoDescription}
                    </div>
                  )}
                  {t.publishedAt && (
                    <div className="text-[10px] text-muted-foreground mt-2">
                      Published {new Date(t.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="mt-auto border-t border-hairline bg-card/60 px-3 sm:px-4 md:px-6 py-2.5 text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
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
      {/* Mobile primary nav, fixed to the viewport bottom */}
      <MobileBottomNav mobilePane={null} className="fixed bottom-0 inset-x-0 z-40" />
    </div>
  )
}
