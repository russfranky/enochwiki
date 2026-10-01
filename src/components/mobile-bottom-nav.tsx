'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Tags, Layers, MoreHorizontal, ShieldCheck, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ThemeToggle } from '@/components/theme-toggle'

// Shared mobile bottom navigation: the single primary nav on mobile.
// Four tabs, labels never icon-only. Read and Explore switch panes on `/`
// and deep-link there from other routes; Topics navigates; More opens a
// bottom-sheet drawer with secondary links.
export type MobilePane = 'scripture' | 'right'

interface MobileBottomNavProps {
  mobilePane: MobilePane | null
  // Only meaningful on `/`; on other routes the tabs navigate instead, so
  // this stays optional (server components cannot pass function props).
  onPaneChange?: (pane: MobilePane) => void
  className?: string
}

const TAB_BASE =
  'flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 transition-colors'

export function MobileBottomNav({ mobilePane, onPaneChange, className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const onHome = pathname === '/'
  const readActive = onHome && mobilePane === 'scripture'
  const exploreActive = onHome && mobilePane === 'right'
  const topicsActive = pathname === '/topics' || pathname.startsWith('/topics/')

  const goRead = () => {
    if (onHome) onPaneChange?.('scripture')
    else router.push('/')
  }
  const goExplore = () => {
    if (onHome) onPaneChange?.('right')
    else router.push('/?panel=explore')
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn('sm:hidden flex border-t border-border bg-card', className)}
      >
        <button
          type="button"
          onClick={goRead}
          aria-current={readActive ? 'page' : undefined}
          className={cn(
            TAB_BASE,
            readActive ? 'text-accent-strong border-t-2 border-accent-strong -mt-px' : 'text-muted-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Read
        </button>
        <button
          type="button"
          onClick={() => router.push('/topics')}
          aria-current={topicsActive ? 'page' : undefined}
          className={cn(
            TAB_BASE,
            topicsActive ? 'text-accent-strong border-t-2 border-accent-strong -mt-px' : 'text-muted-foreground'
          )}
        >
          <Tags className="h-4 w-4" />
          Topics
        </button>
        <button
          type="button"
          onClick={goExplore}
          aria-current={exploreActive ? 'page' : undefined}
          className={cn(
            TAB_BASE,
            exploreActive ? 'text-accent-strong border-t-2 border-accent-strong -mt-px' : 'text-muted-foreground'
          )}
        >
          <Layers className="h-4 w-4" />
          Explore
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
          aria-expanded={moreOpen}
          className={cn(TAB_BASE, 'text-muted-foreground')}
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </button>
      </nav>

      {/* More drawer: secondary links as a mobile bottom sheet. Vaul traps
          focus inside on open, returns focus on close, and Escape closes. */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="sm:hidden">
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col">
            <DrawerClose asChild>
              <Link
                href="/how-we-vet"
                className="flex items-center gap-3 min-h-[44px] px-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary/60 transition"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                How we vet
              </Link>
            </DrawerClose>
            <div className="flex items-center justify-between min-h-[44px] px-2">
              <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                Theme
              </span>
              {/* Extra padding widens the toggle hit area past 44px. */}
              <span className="inline-flex p-2 -m-1">
                <ThemeToggle />
              </span>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
