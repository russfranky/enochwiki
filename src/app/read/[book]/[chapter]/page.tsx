import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { db } from '@/lib/db'

// Server-rendered chapter page (SEO audit Phase 2, cycle 6,
// 2026-11-23). Before this route, chapter text existed only inside
// the client reader app, so the corpus had no indexable or citable
// URLs. Queries mirror /api/scripture exactly. Each page exports its
// own metadata with a self-referencing canonical: without it the page
// would inherit the /read layout's canonical and be filed as a
// duplicate of the reader, the cycle-4 bug one level down.
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://enoch.wiki'

async function loadChapter(bookSlug: string, chapterParam: string) {
  const chapterNum = Number.parseInt(chapterParam, 10)
  if (!Number.isFinite(chapterNum)) return null
  const book = await db.book.findUnique({
    where: { slug: bookSlug },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })
  if (!book) return null
  const chapter = await db.chapter.findFirst({
    where: { bookId: book.id, number: chapterNum },
  })
  if (!chapter) return null
  const verses = await db.verse.findMany({
    where: { chapterId: chapter.id },
    orderBy: { verseNum: 'asc' },
  })
  return { book, chapter, verses }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>
}): Promise<Metadata> {
  const { book: slug, chapter: chapterParam } = await params
  const data = await loadChapter(slug, chapterParam)
  if (!data) return { title: 'Chapter not found' }
  const { book, chapter } = data
  const heading = `${book.name} ${chapter.number}${chapter.title ? `: ${chapter.title}` : ''}`
  const description =
    chapter.summary ||
    `Read ${book.name} chapter ${chapter.number} verse by verse in the ${book.translation || 'public-domain'} translation.`
  return {
    title: heading,
    description,
    alternates: { canonical: `/read/${slug}/${chapter.number}` },
    openGraph: {
      title: `${heading} | enoch.wiki`,
      description,
      url: `/read/${slug}/${chapter.number}`,
      type: 'article',
    },
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>
}) {
  const { book: slug, chapter: chapterParam } = await params
  const data = await loadChapter(slug, chapterParam)
  if (!data) notFound()
  const { book, chapter, verses } = data

  const numbers = book.chapters.map((c) => c.number)
  const idx = numbers.indexOf(chapter.number)
  const prev = idx > 0 ? numbers[idx - 1] : null
  const next = idx >= 0 && idx < numbers.length - 1 ? numbers[idx + 1] : null

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Read', href: '/read' },
    { label: book.name, href: `/read/${book.slug}` },
    { label: `Chapter ${chapter.number}` },
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

        <article className="max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-2">
            {book.name} {chapter.number}
          </h1>
          {chapter.title && (
            <p className="text-lg text-muted-foreground mb-4">{chapter.title}</p>
          )}
          {chapter.summary && (
            <p className="text-base leading-relaxed mb-8">{chapter.summary}</p>
          )}

          <div className="space-y-4">
            {verses.map((v) => (
              <p key={v.id} id={`v${v.verseNum}`} className="leading-relaxed scroll-mt-24">
                <sup className="text-muted-foreground font-medium mr-1.5">{v.verseNum}</sup>
                {v.text}
                {v.geezText && (
                  <span className="block text-sm text-muted-foreground mt-1" lang="gez">
                    {v.geezText}
                  </span>
                )}
              </p>
            ))}
          </div>

          <nav aria-label="Chapter navigation" className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-sm">
            {prev !== null ? (
              <Link href={`/read/${book.slug}/${prev}`} className="underline hover:text-foreground">
                ← Chapter {prev}
              </Link>
            ) : (
              <span />
            )}
            <Link href={`/read/${book.slug}`} className="hover:text-foreground hover:underline">
              All chapters of {book.name}
            </Link>
            {next !== null ? (
              <Link href={`/read/${book.slug}/${next}`} className="underline hover:text-foreground">
                Chapter {next} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

          <p className="mt-6 text-sm text-muted-foreground">
            Studying this chapter?{' '}
            <Link href="/read" className="underline hover:text-foreground">
              Open it in the reader app
            </Link>{' '}
            for themes, evidence, and chat.
          </p>
        </article>
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
