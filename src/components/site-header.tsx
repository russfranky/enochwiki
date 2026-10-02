'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'

// Shared public header for every page, including the study experience on /.
// Mobile keeps a single compact row: brand + Search. Primary navigation lives
// in the mobile bottom tab bar; desktop keeps inline nav links.
// Labels are never icon-only.
interface SiteHeaderProps {
  onSearchToggle?: () => void
  searchOpen?: boolean
}

const NAV_LINKS = [
  { href: '/topics', label: 'Topics' },
  { href: '/books', label: 'Books' },
  { href: '/how-we-vet', label: 'How we vet' },
]

function BrandMark() {
  return (
    <svg viewBox="0 0 240 240" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" aria-label="enoch.wiki mark" role="img">
      <circle cx="120" cy="120" r="100" fill="none" stroke="var(--gold-500)" strokeWidth="4"/>
      <path d="M 120 20 L 129.9 96 L 163.8 76.2 L 144 110.1 L 220 120 L 144 129.9 L 163.8 163.8 L 129.9 144 L 120 220 L 110.1 144 L 76.2 163.8 L 96 129.9 L 20 120 L 96 110.1 L 76.2 76.2 L 110.1 96 Z" fill="var(--gold-500)"/>
      <ellipse cx="120" cy="120" rx="112" ry="42" fill="none" stroke="var(--gold-500)" strokeWidth="5" transform="rotate(-22 120 120)"/>
    </svg>
  )
}

export function SiteHeader({ onSearchToggle, searchOpen }: SiteHeaderProps) {
  return (
    <header className="border-b border-hairline bg-card/85 backdrop-blur-md sticky top-0 z-30">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0" aria-label="enoch.wiki home">
            <BrandMark />
            <span className="min-w-0">
              <span className="font-serif text-lg sm:text-xl font-semibold leading-tight text-foreground block truncate" style={{ fontFamily: 'var(--font-display-stack)' }}>
                enoch<span style={{ color: 'var(--gold-500)' }}>.</span>wiki
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground -mt-0.5 hidden sm:block" style={{ fontFamily: 'var(--font-ui-stack)' }}>
                The Ethiopian Bible, corroborated
              </span>
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Desktop nav links */}
            <nav className="hidden sm:flex items-center gap-1" aria-label="Primary">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs px-2 sm:px-3 py-1.5 rounded transition text-muted-foreground hover:text-foreground"
                  style={{ fontFamily: 'var(--font-ui-stack)' }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            {onSearchToggle && (
              <button
                onClick={onSearchToggle}
                aria-label="Search"
                aria-expanded={!!searchOpen}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-indigo-200 bg-transparent text-indigo-600 dark:text-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-xs font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                style={{ fontFamily: 'var(--font-ui-stack)' }}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
