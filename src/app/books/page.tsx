import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { BOOKS, type Book } from '@/lib/books'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Book Index: Editions and Translations of 1 Enoch',
  description:
    'A neutral index of editions, translations, and reference works on the Book of Enoch, the Ethiopian canon, and Second Temple literature.',
  alternates: { canonical: '/books' },
  openGraph: {
    title: 'Book Index | enoch.wiki',
    description:
      'Editions, translations, and reference works on 1 Enoch, the Ethiopian canon, and Second Temple literature.',
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
        'flex flex-col justify-between rounded-md border border-border bg-card p-4 shadow-sm overflow-hidden ' +
        (size === 'lg' ? 'aspect-[2/3] w-40 sm:w-52' : 'aspect-[2/3] w-24')
      }
    >
      <div
        className={
          'font-serif font-semibold leading-tight text-foreground break-words ' +
          (size === 'lg' ? 'text-lg sm:text-xl' : 'text-xs')
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
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Book Index</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Editions, translations, and reference works on 1 Enoch, the Ethiopian
          Tewahedo canon, and Second Temple literature. Bibliographic information
          only; inclusion is not an endorsement.
        </p>

        {featured && (
          <section aria-label="Featured book" className="mb-10">
            <Link href={`/books/${featured.slug}`}>
              <Card className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 cursor-pointer transition border-border hover:border-accent/50 hover:bg-secondary/40">
                <BookCover book={featured} size="lg" />
                <div className="min-w-0">
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
