import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { db } from '@/lib/db'

// Server-rendered chapter index for one book (SEO audit Phase 2,
// cycle 6, 2026-11-23). The reader app at /read is client-rendered, so
// crawlers saw no chapter URLs at all; these pages give every chapter
// a stable, citable address. Queries mirror /api/scripture exactly.
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://enoch.wiki'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string }>
}): Promise<Metadata> {
  const { book: slug } = await params
  const book = await db.book.findUnique({
    where: { slug },
    select: { name: true, summary: true },
  })
  if (!book) return { title: 'Book not found' }
  return {
    title: `${book.name}: chapters`,
    description:
      book.summary || `Read ${book.name} chapter by chapter, verse by verse, with its evidence.`,
    alternates: { canonical: `/read/${slug}` },
    openGraph: {
      title: `${book.name} | enoch.wiki`,
      description:
        book.summary || `Read ${book.name} chapter by chapter, verse by verse, with its evidence.`,
      url: `/read/${slug}`,
      type: 'website',
    },
  }
}

export default async function BookChaptersPage({
  params,
}: {
  params: Promise<{ book: string }>
}) {
  const { book: slug } = await params
  const book = await db.book.findUnique({
    where: { slug },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })
  if (!book) notFound()

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Read', href: '/read' },
    { label: book.name },
  ]

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs, SITE_URL)) }}
        />
        <Breadcrumbs items={crumbs} />

        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-2">
            {book.name}
          </h1>
          {book.geezName && (
            <p className="text-lg text-muted-foreground mb-4" lang="gez">
              {book.geezName}
            </p>
          )}
          {book.summary && <p className="text-base leading-relaxed mb-4">{book.summary}</p>}
          {book.translation && (
            <p className="text-sm text-muted-foreground mb-8">Translation: {book.translation}</p>
          )}

          <h2 className="font-serif text-xl font-semibold mb-4">Chapters on this site</h2>
          {book.chapters.length === 0 ? (
            <p className="text-muted-foreground">No chapters published yet. Check back soon.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {book.chapters.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/read/${book.slug}/${c.number}`}
                    className="flex items-baseline gap-3 py-3 hover:bg-card/60 px-2 -mx-2 rounded"
                  >
                    <span className="font-serif font-semibold whitespace-nowrap">
                      Chapter {c.number}
                    </span>
                    {c.title && <span className="text-muted-foreground">{c.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 text-sm">
            Prefer the interactive reader?{' '}
            <Link href="/read" className="underline hover:text-foreground">
              Open {book.name} in the reader app
            </Link>
            .
          </p>
        </div>
      </main>
      <footer className="mt-auto mb-16 sm:mb-0 border-t border-hairline bg-card/60 px-3 sm:px-4 md:px-6 py-2.5 text-[10px] sm:text-[11px] text-muted-foreground">
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
      <MobileBottomNav mobilePane={null} className="fixed bottom-0 inset-x-0 z-40" />
    </div>
  )
}
