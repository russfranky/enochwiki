'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Scale,
  Layers,
  X,
  Brain,
  MessageSquare,
} from 'lucide-react'
import { ScriptureReader } from '@/components/study/scripture-reader'
import { ChatPanel } from '@/components/study/chat-panel'
import { SynergyView } from '@/components/study/synergy-view'
import { ThemeExplorer } from '@/components/study/theme-explorer'
import { StudyTools } from '@/components/study/study-tools'
import { SiteHeader } from '@/components/site-header'
import { ThemeToggle } from '@/components/theme-toggle'
import { AI_ENABLED } from '@/lib/launch'

// D-002: Source URLs come from the database — allowlist http/https before
// injecting into href so a poisoned `javascript:` URL cannot execute on click.
const safeHref = (u: unknown): string | undefined =>
  typeof u === 'string' && /^https?:\/\//i.test(u.trim()) ? u : undefined

type RightTab = 'synergy' | 'themes' | 'tools'
type MobilePanel = 'scripture' | 'chat' | 'right'

export default function Home() {
  const [selectedVerseRef, setSelectedVerseRef] = useState<string | null>(null)
  const [selectedVerseText, setSelectedVerseText] = useState<string>('')
  const [chatContext, setChatContext] = useState<string>('')
  const [selectedThemeSlug, setSelectedThemeSlug] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('synergy')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [currentBookSlug, setCurrentBookSlug] = useState<string>('')
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('scripture')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleVerseSelect = useCallback(
    (ref: string, text: string, context: string) => {
      if (selectedVerseRef === ref) {
        setSelectedVerseRef(null)
        setSelectedVerseText('')
        setChatContext('')
      } else {
        setSelectedVerseRef(ref)
        setSelectedVerseText(text)
        setChatContext(context)
      }
    },
    [selectedVerseRef],
  )

  const handleThemeSelect = useCallback((slug: string) => {
    setSelectedThemeSlug(slug || null)
  }, [])

  async function runSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/fts?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data)
    } finally {
      setSearching(false)
    }
  }

  // Right panel content (shared between desktop and mobile)
  const rightPanelContent = (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border bg-secondary/40">
        <button
          onClick={() => setRightTab('synergy')}
          className={`flex-1 px-1 sm:px-3 py-2.5 text-[10px] sm:text-xs font-medium transition-colors ${
            rightTab === 'synergy' ? 'bg-card text-primary border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-3.5 w-3.5 inline mr-1" />
          <span>Corroboration</span>
        </button>
        <button
          onClick={() => setRightTab('themes')}
          className={`flex-1 px-1 sm:px-3 py-2.5 text-[10px] sm:text-xs font-medium transition-colors ${
            rightTab === 'themes' ? 'bg-card text-primary border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5 inline mr-1" />
          <span>Themes</span>
        </button>
        <button
          onClick={() => setRightTab('tools')}
          className={`flex-1 px-1 sm:px-3 py-2.5 text-[10px] sm:text-xs font-medium transition-colors ${
            rightTab === 'tools' ? 'bg-card text-primary border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="h-3.5 w-3.5 inline mr-1" />
          <span>Study Tools</span>
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {rightTab === 'synergy' && <SynergyView selectedVerseRef={selectedVerseRef} />}
        {rightTab === 'themes' && (
          <ThemeExplorer
            onSelectTheme={handleThemeSelect}
            selectedThemeSlug={selectedThemeSlug}
          />
        )}
        {rightTab === 'tools' && (
          <StudyTools bookSlug={currentBookSlug} chapterNum={currentChapterNum} />
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader onSearchToggle={() => setSearchOpen((s) => !s)} searchOpen={searchOpen} />

        {/* Selected verse indicator */}
        {selectedVerseRef && (
          <div className="px-3 sm:px-4 md:px-6 py-1.5 border-t border-border bg-accent/10 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground hidden sm:inline">Selected verse:</span>
            <strong className="font-mono text-accent">{selectedVerseRef}</strong>
            <span className="text-muted-foreground truncate italic flex-1">: "{selectedVerseText.slice(0, 80)}..."</span>
            <button
              onClick={() => {
                setSelectedVerseRef(null)
                setSelectedVerseText('')
                setChatContext('')
              }}
              className="text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* FTS Search bar */}
        {searchOpen && (
          <div className="px-3 sm:px-4 md:px-6 py-2 border-t border-border bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search verses, sources, evidence..."
                className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-background min-w-0"
              />
              <Button size="sm" onClick={runSearch} disabled={searching}>
                {searching ? '...' : 'Search'}
              </Button>
            </div>
            {searchResults && (
              <div className="mt-2 max-h-80 overflow-y-auto text-sm border border-border rounded-md bg-background p-2">
                <div className="text-[10px] text-muted-foreground mb-1.5">
                  {searchResults.verses?.length || 0} verses ·{' '}
                  {searchResults.sources?.length || 0} sources ·{' '}
                  {searchResults.evidence?.length || 0} evidence
                </div>
                {searchResults.verses?.slice(0, 5).map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      handleVerseSelect(v.ref, v.text, `${v.ref}\n\n"${v.text}"`)
                      setSearchOpen(false)
                    }}
                    className="block w-full text-left p-1.5 hover:bg-secondary rounded text-xs"
                  >
                    <span className="font-mono text-accent mr-2">{v.ref}</span>
                    {v.text.slice(0, 100)}...
                  </button>
                ))}
                {searchResults.sources?.slice(0, 3).map((s: any) => (
                  <a
                    key={s.id}
                    href={safeHref(s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-1.5 hover:bg-secondary rounded text-xs"
                  >
                    <span className="font-medium">{s.title}</span>
                    <span className="text-muted-foreground ml-2">({s.domain})</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {/* Mobile: panel switcher with bottom nav */}
        {isMobile ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              {mobilePanel === 'scripture' && (
                <ScriptureReader
                  onVerseSelect={handleVerseSelect}
                  selectedVerseRef={selectedVerseRef}
                  selectedThemeSlug={selectedThemeSlug}
                  onClearTheme={() => setSelectedThemeSlug(null)}
                  onChapterChange={(slug, num) => {
                    setCurrentBookSlug(slug)
                    setCurrentChapterNum(num)
                  }}
                />
              )}
              {AI_ENABLED && mobilePanel === 'chat' && <ChatPanel context={chatContext} />}
              {mobilePanel === 'right' && rightPanelContent}
            </div>
            {/* Mobile bottom nav */}
            <div className="flex border-t border-border bg-card">
              <button
                onClick={() => setMobilePanel('scripture')}
                className={`flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 ${
                  mobilePanel === 'scripture' ? 'text-accent border-t-2 border-accent -mt-px' : 'text-muted-foreground'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Read
              </button>
              {AI_ENABLED && (
                <button
                  onClick={() => setMobilePanel('chat')}
                  className={`flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 ${
                    mobilePanel === 'chat' ? 'text-accent border-t-2 border-accent -mt-px' : 'text-muted-foreground'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask
                </button>
              )}
              <button
                onClick={() => setMobilePanel('right')}
                className={`flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 ${
                  mobilePanel === 'right' ? 'text-accent border-t-2 border-accent -mt-px' : 'text-muted-foreground'
                }`}
              >
                <Layers className="h-4 w-4" />
                Explore
              </button>
            </div>
          </div>
        ) : AI_ENABLED ? (
          /* Desktop: 3-pane resizable (AI chat shown) */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={34} minSize={24}>
              <ScriptureReader
                onVerseSelect={handleVerseSelect}
                selectedVerseRef={selectedVerseRef}
                selectedThemeSlug={selectedThemeSlug}
                onClearTheme={() => setSelectedThemeSlug(null)}
                onChapterChange={(slug, num) => {
                  setCurrentBookSlug(slug)
                  setCurrentChapterNum(num)
                }}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={34} minSize={24}>
              <ChatPanel context={chatContext} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={32} minSize={24}>
              {rightPanelContent}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Desktop: 2-pane resizable (AI chat hidden for launch) */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ScriptureReader
                onVerseSelect={handleVerseSelect}
                selectedVerseRef={selectedVerseRef}
                selectedThemeSlug={selectedThemeSlug}
                onClearTheme={() => setSelectedThemeSlug(null)}
                onChapterChange={(slug, num) => {
                  setCurrentBookSlug(slug)
                  setCurrentChapterNum(num)
                }}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={24}>
              {rightPanelContent}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-hairline bg-card/60 px-3 sm:px-4 md:px-6 py-2.5 text-[10px] sm:text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-read-stack)' }} className="italic hidden sm:inline">
            &ldquo;Pursue truth at all costs, carry no bias.&rdquo;
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px]" style={{ fontFamily: 'var(--font-ui-stack)' }}>
          <Link href="/how-we-vet" className="hover:text-foreground">How we vet content</Link>
          <span>·</span>
          <span className="font-semibold text-foreground">enoch.wiki</span>
          <span>·</span>
          <span className="[&>button]:h-6 [&>button]:w-6 [&_svg]:h-3 [&_svg]:w-3" title="Theme">
            <ThemeToggle />
          </span>
        </div>
      </footer>
    </div>
  )
}
