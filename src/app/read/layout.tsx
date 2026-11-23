import type { Metadata } from 'next'

// The reader page is a client component and cannot export metadata.
// This server layout carries its metadata instead: without it the page
// inherited the root layout's canonical ("/") and told search engines
// it was a duplicate of the homepage (SEO audit, 2026-11-23).
export const metadata: Metadata = {
  title: 'Read the texts',
  description:
    'Verse-by-verse reader for 1 Enoch, Jubilees, Meqabyan, and the wider Ethiopian canon, each verse paired with its evidence.',
  alternates: { canonical: '/read' },
}

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return children
}
