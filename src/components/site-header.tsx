import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

// Simple public header for the content pages (Topics, How we vet).
// The study experience on / keeps its own richer header.
export function SiteHeader() {
  return (
    <header className="border-b border-hairline bg-card/85 backdrop-blur-md sticky top-0 z-30">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <svg viewBox="0 0 240 240" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" aria-label="enoch.wiki mark" role="img">
            <circle cx="120" cy="120" r="100" fill="none" stroke="var(--gold-500)" strokeWidth="4"/>
            <path d="M 120 20 L 129.9 96 L 163.8 76.2 L 144 110.1 L 220 120 L 144 129.9 L 163.8 163.8 L 129.9 144 L 120 220 L 110.1 144 L 76.2 163.8 L 96 129.9 L 20 120 L 96 110.1 L 76.2 76.2 L 110.1 96 Z" fill="var(--gold-500)"/>
            <ellipse cx="120" cy="120" rx="112" ry="42" fill="none" stroke="var(--gold-500)" strokeWidth="5" transform="rotate(-22 120 120)"/>
          </svg>
          <span className="font-serif text-lg sm:text-xl font-semibold leading-tight text-foreground" style={{ fontFamily: 'var(--font-display-stack)' }}>
            enoch<span style={{ color: 'var(--gold-500)' }}>.</span>wiki
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Link
            href="/topics"
            className="text-xs px-2 sm:px-3 py-1.5 rounded transition text-muted-foreground hover:text-foreground"
            style={{ fontFamily: 'var(--font-ui-stack)' }}
          >
            Topics
          </Link>
          <Link
            href="/how-we-vet"
            className="text-xs px-2 sm:px-3 py-1.5 rounded transition text-muted-foreground hover:text-foreground"
            style={{ fontFamily: 'var(--font-ui-stack)' }}
          >
            How we vet
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
