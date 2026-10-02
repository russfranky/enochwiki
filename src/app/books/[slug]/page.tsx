import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { getBook, getBookSlugs } from '@/lib/books'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return getBookSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const book = getBook(slug)
  if (!book) return { title: 'Book not found' }
  return {
    title: `${book.title} by ${book.author}`,
    description: book.tagline,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title: `${book.title} | enoch.wiki Books`,
      description: book.tagline,
      url: `/books/${book.slug}`,
      type: 'article',
    },
  }
}

const SITE_URL = 'https://enoch.wiki'

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = getBook(slug)
  if (!book) notFound()

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Books', href: '/books' },
    { label: book.title },
  ]

  const bookJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: book.author },
    publisher: { '@type': 'Organization', name: book.publisher },
    datePublished: String(book.year),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    description: book.tagline,
  }

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs, SITE_URL)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
        />
        <Breadcrumbs items={crumbs} />

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">
          {/* Cover */}
          <div
            aria-hidden="true"
            className="flex flex-col justify-between rounded-md border border-border bg-card p-6 shadow-sm aspect-[2/3] w-44 sm:w-60 flex-shrink-0 overflow-hidden"
          >
            <div className="font-serif text-xl sm:text-2xl font-semibold leading-tight text-foreground break-words">
              {book.title}
            </div>
            <div className="text-sm text-muted-foreground leading-snug">{book.author}</div>
          </div>

          {/* Details */}
          <div className="min-w-0 max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-2">
              {book.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">{book.author}</p>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-8 max-w-md">
              <div>
                <dt className="text-muted-foreground">Publisher</dt>
                <dd className="font-medium text-foreground">{book.publisher}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Published</dt>
                <dd className="font-medium text-foreground">{book.year}</dd>
              </div>
              {book.isbn && (
                <div>
                  <dt className="text-muted-foreground">ISBN</dt>
                  <dd className="font-medium text-foreground">{book.isbn}</dd>
                </div>
              )}
            </dl>

            <div className="space-y-4 text-foreground leading-relaxed mb-8">
              {book.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {book.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {book.topics.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/50 text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {book.affiliateUrl ? (
              <a
                href={book.affiliateUrl}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="inline-flex items-center gap-2 rounded-md bg-accent-strong px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Get this book <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}

            <div className="mt-10">
              <Link href="/books" className="text-sm text-accent hover:underline">
                ← Back to all books
              </Link>
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav mobilePane={null} className="fixed bottom-0 inset-x-0 z-40" />
    </div>
  )
}
