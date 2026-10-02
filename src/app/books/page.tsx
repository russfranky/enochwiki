import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { BOOKS, type Book } from '@/lib/books'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Recommended Books on 1 Enoch and the Ethiopian Canon',
  description:
    'Curated books on the Book of Enoch, the Ethiopian Tewahedo canon, and Second Temple literature: the translations and references worth your shelf.',
  alternates: { canonical: '/books' },
  openGraph: {
    title: 'Recommended Books | enoch.wiki',
    description:
      'The translations and references worth your shelf: 1 Enoch, the Ethiopian canon, and Second Temple literature.',
    url: '/books',
    type: 'website',
  },
}

const SITE_URL = 'https://enoch.wiki'

// Typographic cover: no hotlinked retail images, no invented covers.
function BookCover({ book, size }: { book: Book; size: 'sm' | 'lg' }) {
  return (
    <div
      aria-hidden="true"
      className={
        'flex flex-col justify-between rounded-md border border-border bg-card p-4 shadow-sm ' +
        (size === 'lg' ? 'aspect-[2/3] w-40 sm:w-52' : 'aspect-[2/3] w-24')
      }
    >
      <div
        className={
          'font-serif font-semibold leading-tight text-foreground ' +
          (size === 'lg' ? 'text-lg sm:text-xl' : 'text-sm')
        }
      >
        {book.title}
      </div>
      <div className="text-xs text-muted-foreground leading-snug">{book.author}</div>
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`} className="block h-full">
      <Card className="p-4 h-full flex gap-4 cursor-pointer transition border-border hover:border-accent/50 hover:bg-secondary/40">
        <BookCover book={book} size="sm" />
        <div className="min-w-0">
          <div className="font-serif font-medium leading-snug mb-1">{book.title}</div>
          <div className="text-sm text-muted-foreground mb-2">{book.author}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{book.tagline}</p>
        </div>
      </Card>
    </Link>
  )
}

export default function BooksIndex() {
  const featured = BOOKS.find((b) => b.featured)
  const rest = BOOKS.filter((b) => b !== featured)
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Books' },
  ]

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs, SITE_URL)) }}
        />
        <Breadcrumbs items={crumbs} />
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Recommended Books</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          The translations and references worth your shelf. A short, curated list:
          every title here is one we would hand to a serious reader.
        </p>

        {featured && (
          <section aria-label="Featured book" className="mb-10">
            <Link href={`/books/${featured.slug}`}>
              <Card className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 cursor-pointer transition border-border hover:border-accent/50 hover:bg-secondary/40">
                <BookCover book={featured} size="lg" />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-accent-strong font-semibold mb-2">
                    Start here
                  </div>
                  <h2 className="font-serif text-2xl font-semibold leading-tight mb-1">
                    {featured.title}
                  </h2>
                  <div className="text-muted-foreground mb-3">{featured.author}</div>
                  <p className="text-muted-foreground leading-relaxed max-w-xl">{featured.tagline}</p>
                </div>
              </Card>
            </Link>
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((b) => (
            <BookCard key={b.slug} book={b} />
          ))}
        </div>
      </main>
      <MobileBottomNav mobilePane={null} className="fixed bottom-0 inset-x-0 z-40" />
    </div>
  )
}
