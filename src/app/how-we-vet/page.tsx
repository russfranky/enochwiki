import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { db } from '@/lib/db'
import { Scale, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'How we vet content',
  description: 'Enoch.Wiki holds itself to a public-authority standard. Nothing is presented as authoritative until it clears editorial review.',
}

// Perspective tag colors come from the database; only allow hex colors so a
// stored string cannot break out of the style attribute (stored CSS injection).
const safeColor = (c: unknown) =>
  typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#888888'

export default async function HowWeVet() {
  const [perspectiveTags, claimTypes] = await Promise.all([
    db.perspectiveTag.findMany({ orderBy: { name: 'asc' } }),
    db.claimType.findMany({ orderBy: { name: 'asc' } }),
  ])

  const credibilityTiers = [
    { slug: 'peer-reviewed', name: 'Peer-Reviewed / Academic', description: 'Peer-reviewed journals, university presses, scholarly monographs.' },
    { slug: 'reputable-reference', name: 'Reputable Reference', description: 'Established encyclopedias, museum collections, reputable reference works (e.g. Brill, Oxford, Cambridge).' },
    { slug: 'popular-journalistic', name: 'Popular / Journalistic', description: 'Reputable journalism and popular reference (e.g. Biblical Archaeology Society, Smithsonian).' },
    { slug: 'self-published', name: 'Self-Published / Forum', description: 'Blogs, forums, YouTube, self-published books. Surfaced only with explicit flagging.' },
  ]

  const reviewRubric = [
    'Sources cited and retrievable',
    'Minimum credibility tier met (reputable-reference or higher for authoritative claims)',
    'Claim type labeled',
    'Perspectives represented (no single-source claims unless explicitly flagged)',
    'No fabricated citations',
    'Contested/sensitive claims flagged and contextualized',
    'Authority not overstated',
  ]

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">How Enoch.Wiki vets content</h1>
        <p className="text-muted-foreground mb-8">
          Enoch.Wiki holds itself to a public-authority standard. Nothing is presented as
          authoritative until it clears editorial review. Every public item displays its
          sources, perspective tags, claim-type label, and corroboration score.
        </p>

        <Card className="p-4 sm:p-5 mb-4">
          <h2 className="font-serif text-lg font-semibold mb-2 flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent" />
            Credibility tiers
          </h2>
          <div className="space-y-2.5">
            {credibilityTiers.map((t) => (
              <div key={t.slug} className="text-sm">
                <strong>{t.name}</strong>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 mb-4">
          <h2 className="font-serif text-lg font-semibold mb-2">Perspective / tradition tags</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Every claim is tagged with the traditions that hold it. A claim backed by one tradition
            reads very differently from one backed across many.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perspectiveTags.map((p: any) => (
              <div key={p.slug} className="text-xs p-2.5 rounded border border-border">
                <div className="font-medium flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: safeColor(p.color) }} />
                  {p.name}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 mb-4">
          <h2 className="font-serif text-lg font-semibold mb-2">Claim type labels</h2>
          <div className="space-y-2.5">
            {claimTypes.map((c: any) => (
              <div key={c.slug} className="text-sm">
                <strong>{c.name}</strong>
                <p className="text-xs text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 mb-4">
          <h2 className="font-serif text-lg font-semibold mb-2">Review rubric</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Every item is reviewed against this rubric by a human editor before it can publish:
          </p>
          <ul className="space-y-1.5 text-sm">
            {reviewRubric.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="font-serif text-lg font-semibold mb-2">Content lifecycle</h2>
          <div className="flex flex-wrap gap-1.5">
            {['Draft', 'Auto-Corroborated', 'In Editorial Review', 'Approved / Published', 'Rejected', 'Needs Revision', 'Archived'].map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">
                {s}
              </Badge>
            ))}
          </div>
        </Card>
      </main>
      <footer className="mt-auto border-t border-hairline bg-card/60 px-3 sm:px-4 md:px-6 py-2.5 text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span style={{ fontFamily: 'var(--font-read-stack)' }} className="italic hidden sm:inline">
            &ldquo;Pursue truth at all costs, carry no bias.&rdquo;
          </span>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px]" style={{ fontFamily: 'var(--font-ui-stack)' }}>
            <Link href="/topics" className="hover:text-foreground">Topics</Link>
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
