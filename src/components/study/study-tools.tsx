'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookMarked,
  Layers3,
  Brain,
  Sun,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { AI_ENABLED } from '@/lib/launch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BYOK_PROVIDERS, byokHeaders } from '@/lib/byok'
import { useByok } from '@/hooks/use-byok'
import { KeyRound } from 'lucide-react'

interface StudyToolsProps {
  bookSlug?: string
  chapterNum?: number
}

export function StudyTools({ bookSlug, chapterNum }: StudyToolsProps) {
  const [tab, setTab] = useState(AI_ENABLED ? 'daily' : 'glossary')
  const byok = useByok()
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [daily, setDaily] = useState<any>(null)
  const [glossary, setGlossary] = useState<any[]>([])
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [showBack, setShowBack] = useState(false)

  // Load daily insight (AI UI hidden at launch: skip when the switch is off)
  useEffect(() => {
    if (!AI_ENABLED) return
    fetch('/api/daily-insight').then((r) => r.json()).then((d) => setDaily(d.insight))
  }, [])

  // Load glossary
  useEffect(() => {
    fetch('/api/glossary').then((r) => r.json()).then((d) => setGlossary(d.entries || []))
  }, [])

  // Load flashcards due for review
  useEffect(() => {
    fetch('/api/flashcards?due=1').then((r) => r.json()).then((d) => setFlashcards(d.cards || []))
  }, [])

  // Load summary when book/chapter changes (AI UI hidden at launch: skip when off)
  useEffect(() => {
    if (!AI_ENABLED) return
    if (!bookSlug || !chapterNum) return
    fetch(`/api/summarize?book=${bookSlug}&chapter=${chapterNum}`)
      .then((r) => r.json())
      .then((d) => setSummary(d.summary || null))
  }, [bookSlug, chapterNum])

  async function generateSummary() {
    if (!AI_ENABLED) return
    if (!bookSlug || !chapterNum) return
    setSummaryLoading(true)
    try {
      const r = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...byokHeaders() },
        body: JSON.stringify({ bookSlug, chapterNum }),
      })
      const d = await r.json()
      setSummary(d.summary)
    } finally {
      setSummaryLoading(false)
    }
  }

  async function reviewCard(quality: number) {
    if (flashcards.length === 0) return
    const card = flashcards[currentCard]
    await fetch('/api/flashcards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, quality }),
    })
    setShowBack(false)
    setCurrentCard((c) => (c + 1) % Math.max(flashcards.length, 1))
    // reload cards
    const d = await fetch('/api/flashcards?due=1').then((r) => r.json())
    setFlashcards(d.cards || [])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-secondary/40 px-3 sm:px-4 py-2.5">
        <h2 className="font-serif text-base font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          Study Tools
        </h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className={`grid mx-2 mt-2 h-8 ${AI_ENABLED ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {AI_ENABLED && (
            <TabsTrigger value="daily" className="text-[10px]"><Sun className="h-3 w-3 mr-1" />Daily</TabsTrigger>
          )}
          {AI_ENABLED && (
            <TabsTrigger value="summary" className="text-[10px]"><Sparkles className="h-3 w-3 mr-1" />Summary</TabsTrigger>
          )}
          <TabsTrigger value="flashcards" className="text-[10px]"><Layers3 className="h-3 w-3 mr-1" />Cards</TabsTrigger>
          <TabsTrigger value="glossary" className="text-[10px]"><BookMarked className="h-3 w-3 mr-1" />Glossary</TabsTrigger>
        </TabsList>

        {/* Daily Insight */}
        {AI_ENABLED && (
          <TabsContent value="daily" className="flex-1 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 sm:p-4">
                {daily ? (
                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/30">
                    <div className="text-[10px] uppercase tracking-wider text-accent-strong font-semibold mb-2">
                      Daily Insight · {new Date(daily.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mb-2">{daily.scriptureRef}</div>
                    <blockquote className="text-sm italic border-l-2 border-accent pl-3 mb-3">
                      {daily.scriptureText}
                    </blockquote>
                    {daily.lifeTheme && (
                      <Badge variant="outline" className="text-[10px] mb-2 bg-accent/10">{daily.lifeTheme}</Badge>
                    )}
                    <p className="text-sm leading-relaxed">{daily.reflection}</p>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Passage Summary */}
        {AI_ENABLED && (
          <TabsContent value="summary" className="flex-1 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 sm:p-4">
                {bookSlug && chapterNum ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Chapter:</span>{' '}
                        <span className="font-mono">{bookSlug} {chapterNum}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={generateSummary} disabled={summaryLoading} className="h-7 text-xs">
                        {summaryLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        {summary ? 'Regenerate' : 'Generate'}
                      </Button>
                    </div>
                    {summary ? (
                      <div className="prose-enoch">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Click "Generate" to produce a structured AI summary grounded in this chapter's text.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">Select a chapter to summarize.</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Flashcards */}
        <TabsContent value="flashcards" className="flex-1 mt-0 min-h-0">
          <div className="p-3 sm:p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs">
                <span className="text-muted-foreground">Due:</span> {flashcards.length}
              </div>
            </div>
            {flashcards.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center">
                <div>
                  <Layers3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No flashcards due for review.
                </div>
              </div>
            ) : (
              <>
                <Card
                  className="flex-1 p-4 sm:p-6 cursor-pointer flex flex-col justify-center items-center text-center min-h-[200px]"
                  onClick={() => setShowBack((s) => !s)}
                  role="button"
                  tabIndex={0}
                  aria-label={showBack ? "Hide the answer" : "Reveal the answer"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setShowBack((s) => !s)
                    }
                  }}
                >
                  {showBack ? (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-accent-strong font-semibold mb-2">Back</div>
                      <p className="text-sm">{flashcards[currentCard]?.back}</p>
                      <div className="text-[10px] text-muted-foreground mt-3 font-mono">{flashcards[currentCard]?.scriptureRef}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Front</div>
                      <p className="text-base font-medium">{flashcards[currentCard]?.front}</p>
                      <div className="text-[10px] text-muted-foreground mt-3">Select to reveal answer</div>
                    </>
                  )}
                </Card>
                {showBack && (
                  <div className="mt-3">
                    <div className="text-[10px] text-muted-foreground mb-1.5 text-center">How well did you recall?</div>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { q: 0, label: 'Forgot' },
                        { q: 2, label: 'Hard' },
                        { q: 3, label: 'OK' },
                        { q: 4, label: 'Good' },
                        { q: 5, label: 'Easy' },
                      ].map((b) => (
                        <button
                          key={b.q}
                          onClick={() => reviewCard(b.q)}
                          className="text-[10px] py-1.5 rounded border border-border hover:bg-secondary transition"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2 text-[10px] text-muted-foreground text-center">
                  Card {currentCard + 1} of {flashcards.length}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Glossary */}
        <TabsContent value="glossary" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {glossary.map((g) => (
                <Card key={g.id} className="p-2.5">
                  <div className="flex items-baseline justify-between mb-1">
                    <div>
                      <span className="font-serif font-semibold text-sm">{g.term}</span>
                      {g.geezTerm && <span className="text-xs ml-2 text-muted-foreground">{g.geezTerm}</span>}
                      {g.pronunciation && <span className="text-[10px] ml-2 text-muted-foreground italic">/{g.pronunciation}/</span>}
                    </div>
                    <Badge variant="outline" className="text-[9px]">{g.category}</Badge>
                  </div>
                  <p className="text-xs leading-snug">{g.definition}</p>
                  {g.perspectiveNotes && (
                    <details className="mt-1.5">
                      <summary className="text-[10px] text-accent-strong cursor-pointer">How traditions view this</summary>
                      <div className="text-[11px] mt-1 space-y-1">
                        {Object.entries(JSON.parse(g.perspectiveNotes)).map(([perspective, note]: [string, any]) => (
                          <div key={perspective}>
                            <strong className="text-accent-strong">{perspective}:</strong> <span className="text-muted-foreground">{note}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {g.scriptureRefs && (
                    <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                      Appears in: {g.scriptureRefs.split('|').slice(0, 4).join(', ')}
                      {g.scriptureRefs.split('|').length > 4 && '...'}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Bring your own key */}
      <div className="border-t border-border px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <KeyRound className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold">Your API key</span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {byok.hasKey ? 'Using your key' : 'Using site AI'}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          Optional. Your key stays in this browser tab and is sent only with your
          requests; the site never stores it. Use a dedicated key with a spend cap.
        </p>
        <div className="flex flex-col gap-2">
          <div>
            <Label htmlFor="byok-provider" className="text-[10px]">Provider</Label>
            <select
              id="byok-provider"
              value={byok.providerId}
              onChange={(e) => byok.setProviderId(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {BYOK_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="byok-key" className="text-[10px]">API key</Label>
            <Input
              id="byok-key"
              type="password"
              autoComplete="off"
              placeholder={byok.hasKey ? 'Key saved for this tab (enter to replace)' : 'Paste your key'}
              value={byok.keyInput}
              onChange={(e) => byok.setKeyInput(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          {byok.isCustom && (
            <>
              <div>
                <Label htmlFor="byok-base" className="text-[10px]">Base URL (https)</Label>
                <Input
                  id="byok-base"
                  type="url"
                  placeholder="https://provider.example/v1"
                  value={byok.baseUrl}
                  onChange={(e) => byok.setBaseUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="byok-auth" className="text-[10px]">Key is sent as</Label>
                <select
                  id="byok-auth"
                  value={byok.authStyle}
                  onChange={(e) => byok.setAuthStyle(e.target.value as 'api-key' | 'bearer')}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="bearer">Authorization: Bearer</option>
                  <option value="api-key">api-key header</option>
                </select>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="byok-model" className="text-[10px]">Model</Label>
            <Input
              id="byok-model"
              type="text"
              value={byok.model}
              onChange={(e) => byok.setModel(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={byok.saveKey} disabled={!byok.keyInput.trim()} className="h-7 text-xs">Save key</Button>
            <Button size="sm" variant="outline" onClick={() => void byok.testKey()} disabled={byok.testState === 'testing'} className="h-7 text-xs">
              {byok.testState === 'testing' ? 'Testing...' : 'Test connection'}
            </Button>
            {byok.hasKey && (
              <Button size="sm" variant="ghost" onClick={byok.clearKey} className="h-7 text-xs">Clear</Button>
            )}
          </div>
          {byok.testMessage && (
            <p className={`text-[10px] ${byok.testState === 'ok' ? 'text-green-600' : 'text-destructive'}`}>{byok.testMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}
