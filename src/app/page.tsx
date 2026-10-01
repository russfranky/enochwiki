import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

// Marketing landing page: the SEO front door of enoch.wiki.
// The study app itself lives at /read.
export const metadata: Metadata = {
  title: { absolute: 'enoch.wiki: The Ethiopian Bible, corroborated' },
  description:
    'enoch.wiki is a scholarly-neutral study resource for the Book of Enoch and the Ethiopian Tewahedo canon. Scripture paired with its evidence: every claim labeled, every source tiered.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'enoch.wiki: The Ethiopian Bible, corroborated',
    description:
      'A scholarly-neutral study resource for the Book of Enoch and the Ethiopian Tewahedo canon. Every claim labeled, every source tiered.',
    url: '/',
    type: 'website',
  },
}

export default function Page() {
  return <LandingPage />
}
