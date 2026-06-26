'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ScrollText,
  Network,
  Clock,
  ExternalLink,
  Trash2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Search,
} from 'lucide-react'

interface Evidence {
  id: string
  scriptureRef: string
  scriptureText: string | null
  claim: string
  corroboration: string
  alignment: string
  confidence: number
  notes: string | null
  source?: {
    id: string
    url: string
    title: string
    domain: string
    category: string
    credibility: number
    author: string | null
    summary: string | null
    publishedAt: string | null
  } | null
}

interface CrossRef {
  id: string
  sourceRef: string
  targetRef: string
  relationship: string
  note: string | null
  confidence: number
}

interface SynergyViewProps {
  selectedVerseRef: string | null
}

export function SynergyView({ selectedVerseRef }: SynergyViewProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [allEvidence, setAllEvidence] = useState<Evidence[]>([])
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapeQuery, setScrapeQuery] = useState('')

  // Load all evidence + cross-refs
  useEffect(() => {
    Promise.all([
      fetch('/api/evidence').then((r) => r.json()),
      fetch('/api/cross-refs').then((r) => r.json()),
    ])
      .then(([ev, cr]) => {
        setAllEvidence(ev.evidences || [])
        setCrossRefs(cr.crossReferences || [])
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter to selected verse
  useEffect(() => {
    if (selectedVerseRef) {
      const matched = allEvidence.filter((e) => e.scriptureRef === selectedVerseRef)
      setEvidence(matched)
    } else {
      setEvidence(allEvidence)
    }
  }, [selectedVerseRef, allEvidence])

  async function scrapeFor() {
    if (!scrapeQuery.trim()) return
    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: scrapeQuery.trim(),
          scriptureRef: selectedVerseRef || undefined,
        }),
      })
      if (!res.ok) throw new Error('Scrape failed')
      const data = await res.json()
      // reload evidence
      const ev = await fetch('/api/evidence').then((r) => r.json())
      setAllEvidence(ev.evidences || [])
      alert(
        `Scraped ${data.found} sources, saved ${data.saved} new sources${
          selectedVerseRef ? `, auto-linked to ${selectedVerseRef}` : ''
        }.`,
      )
      setScrapeQuery('')
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setScraping(false)
    }
  }

  async function deleteEvidence(id: string) {
    if (!confirm('Delete this evidence record?')) return
    await fetch(`/api/evidence?id=${id}`, { method: 'DELETE' })
    setAllEvidence((e) => e.filter((x) => x.id !== id))
  }

  async function updateAlignment(id: string, alignment: string) {
    await fetch('/api/evidence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, alignment }),
    })
    setAllEvidence((e) =>
      e.map((x) => (x.id === id ? { ...x, alignment } : x)),
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-secondary/40">
        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent" />
          Synergy &amp; Corroboration
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Scripture ↔ evidence alignment across three lenses
        </p>
      </div>

      <Tabs defaultValue="side" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-3 sm:mx-4 mt-3">
          <TabsTrigger value="side" className="text-xs">
            <ScrollText className="h-3.5 w-3.5 mr-1" />
            Side-by-side
          </TabsTrigger>
          <TabsTrigger value="graph" className="text-xs">
            <Network className="h-3.5 w-3.5 mr-1" />
            Knowledge Graph
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* SIDE-BY-SIDE */}
        <TabsContent value="side" className="flex-1 mt-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Scrape bar */}
            <div className="px-3 sm:px-4 py-2 border-b border-border bg-card/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scrapeQuery}
                  onChange={(e) => setScrapeQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrapeFor()}
                  placeholder={
                    selectedVerseRef
                      ? `Search for corroborating evidence for ${selectedVerseRef}...`
                      : 'Search for evidence on any topic (e.g. "Qumran Enoch fragments", "Mount Hermon archaeology")...'
                  }
                  className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-background"
                  disabled={scraping}
                />
                <Button onClick={scrapeFor} disabled={scraping || !scrapeQuery.trim()} size="sm">
                  {scraping ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Search className="h-3.5 w-3.5 mr-1" />
                  )}
                  Scrape
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Searches the web via the z-ai SDK, archives results locally with credibility scoring,
                and auto-creates evidence links when a verse is selected.
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-3 sm:px-4 py-3 space-y-3">
                {selectedVerseRef && (
                  <div className="text-xs text-muted-foreground">
                    Showing {evidence.length} evidence record{evidence.length === 1 ? '' : 's'} for{' '}
                    <strong className="text-foreground">{selectedVerseRef}</strong>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                ) : evidence.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No evidence records yet.
                    <p className="text-xs mt-2">
                      Use the search bar above to scrape external sources, or select a verse to see
                      pre-loaded corroborations.
                    </p>
                  </div>
                ) : (
                  evidence.map((e) => (
                    <EvidenceCard
                      key={e.id}
                      evidence={e}
                      onDelete={deleteEvidence}
                      onUpdateAlignment={updateAlignment}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* KNOWLEDGE GRAPH */}
        <TabsContent value="graph" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-3 sm:px-4 py-3">
              <KnowledgeGraphView
                evidence={allEvidence}
                crossRefs={crossRefs}
                selectedRef={selectedVerseRef}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-3 sm:px-4 py-3">
              <TimelineView evidence={allEvidence} crossRefs={crossRefs} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Evidence Card ────────────────────────────────────────────────────────────

function EvidenceCard({
  evidence,
  onDelete,
  onUpdateAlignment,
}: {
  evidence: Evidence
  onDelete: (id: string) => void
  onUpdateAlignment: (id: string, alignment: string) => void
}) {
  const alignmentColor = (a: string) => {
    switch (a) {
      case 'supports': return 'tag-historically-corroborated'
      case 'challenges': return 'tag-contested-minority'
      case 'contextualizes': return 'tag-scholarly-consensus'
      default: return 'tag-speculative'
    }
  }

  const credibilityIcon = (c: number) => {
    if (c >= 0.85) return <ShieldCheck className="h-3 w-3 text-emerald-600" />
    if (c >= 0.6) return <ShieldCheck className="h-3 w-3 text-amber-600" />
    return <ShieldAlert className="h-3 w-3 text-rose-600" />
  }

  return (
    <Card className="p-3.5 border-border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${alignmentColor(evidence.alignment)}`}>
              {evidence.alignment}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {evidence.source?.category || 'unknown'}
            </Badge>
            {evidence.source && (
              <Badge variant="outline" className="text-[10px] gap-1">
                {credibilityIcon(evidence.source.credibility)}
                {(evidence.source.credibility * 100).toFixed(0)}% credibility
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              confidence: {(evidence.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(evidence.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Scripture side */}
      <div className="mb-2.5 p-2 rounded-md bg-secondary/40 border border-border">
        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-0.5">
          Scripture — {evidence.scriptureRef}
        </div>
        {evidence.scriptureText ? (
          <p className="text-xs italic text-muted-foreground leading-snug">
            &ldquo;{evidence.scriptureText.slice(0, 180)}
            {evidence.scriptureText.length > 180 ? '...' : ''}&rdquo;
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">{evidence.claim}</p>
        )}
      </div>

      {/* Evidence side */}
      <div className="p-2 rounded-md bg-accent/5 border border-accent/20">
        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-0.5">
          Evidence
        </div>
        <p className="text-sm leading-snug mb-1.5">{evidence.corroboration}</p>
        {evidence.notes && (
          <p className="text-[11px] text-muted-foreground italic mt-1">{evidence.notes}</p>
        )}
      </div>

      {/* Source attribution */}
      {evidence.source && (
        <div className="mt-2 pt-2 border-t border-border">
          <a
            href={evidence.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 text-xs hover:text-accent transition group"
          >
            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">{evidence.source.title}</div>
              <div className="text-[10px] text-muted-foreground">
                {evidence.source.domain}
                {evidence.source.author && ` · ${evidence.source.author}`}
                {evidence.source.publishedAt &&
                  ` · ${new Date(evidence.source.publishedAt).toLocaleDateString()}`}
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Alignment controls */}
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground">Reclassify:</span>
        {['supports', 'challenges', 'contextualizes', 'neutral'].map((a) => (
          <button
            key={a}
            onClick={() => onUpdateAlignment(evidence.id, a)}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
              evidence.alignment === a
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ── Knowledge Graph (simplified SVG) ─────────────────────────────────────────

function KnowledgeGraphView({
  evidence,
  crossRefs,
  selectedRef,
}: {
  evidence: Evidence[]
  crossRefs: CrossRef[]
  selectedRef: string | null
}) {
  // Build node set
  const scriptureRefs = new Set<string>()
  evidence.forEach((e) => scriptureRefs.add(e.scriptureRef))
  crossRefs.forEach((cr) => {
    scriptureRefs.add(cr.sourceRef)
    scriptureRefs.add(cr.targetRef)
  })
  const sourceIds = new Set(evidence.map((e) => e.source?.id).filter(Boolean) as string[])
  // Deduplicate sources by id (Prisma returns separate object instances per evidence record)
  const sourcesMap = new Map<string, any>()
  evidence.forEach((e) => {
    if (e.source && !sourcesMap.has(e.source.id)) {
      sourcesMap.set(e.source.id, e.source)
    }
  })
  const sources = Array.from(sourcesMap.values())

  // Layout: scripture nodes on the left, source nodes on the right, evidence as edges
  const refs = Array.from(scriptureRefs)
  const refPositions = new Map<string, { x: number; y: number }>()
  refs.forEach((r, i) => {
    refPositions.set(r, {
      x: 80,
      y: 40 + i * 50,
    })
  })
  const sourcePositions = new Map<string, { x: number; y: number }>()
  sources.forEach((s, i) => {
    sourcePositions.set(s.id, {
      x: 460,
      y: 40 + i * 60,
    })
  })

  const width = 580
  const height = Math.max(refs.length * 50, sources.length * 60) + 80

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Visualization of how scripture (left) connects to corroborating sources (right) and to other
        scripture via cross-references (left-to-left links). Hover or click to inspect.
      </p>
      <div className="overflow-x-auto border border-border rounded-md bg-card">
        <svg width={width} height={height} className="block">
          {/* Cross-ref edges (scripture ↔ scripture) */}
          {crossRefs.map((cr) => {
            const a = refPositions.get(cr.sourceRef)
            const b = refPositions.get(cr.targetRef)
            if (!a || !b) return null
            return (
              <g key={cr.id}>
                <path
                  d={`M ${a.x} ${a.y} C ${a.x - 30} ${a.y}, ${a.x - 30} ${b.y}, ${a.x} ${b.y}`}
                  stroke="oklch(0.72 0.12 75 / 0.6)"
                  strokeWidth={1 + cr.confidence * 1.5}
                  fill="none"
                  strokeDasharray="3 2"
                />
              </g>
            )
          })}

          {/* Evidence edges (scripture ↔ source) */}
          {evidence.map((e) => {
            const a = refPositions.get(e.scriptureRef)
            const b = e.source ? sourcePositions.get(e.source.id) : null
            if (!a || !b) return null
            const color =
              e.alignment === 'supports'
                ? 'oklch(0.55 0.16 145 / 0.5)'
                : e.alignment === 'challenges'
                ? 'oklch(0.55 0.22 22 / 0.5)'
                : 'oklch(0.72 0.12 75 / 0.4)'
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={1 + e.confidence * 2}
              />
            )
          })}

          {/* Scripture nodes */}
          {refs.map((r) => {
            const p = refPositions.get(r)!
            const isSelected = selectedRef === r
            return (
              <g key={r}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 10 : 7}
                  fill={isSelected ? 'oklch(0.32 0.13 18)' : 'oklch(0.55 0.18 18)'}
                  stroke="oklch(0.97 0.018 80)"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x + 14}
                  y={p.y + 3.5}
                  className="text-[10px] font-mono"
                  fill="oklch(0.22 0.04 30)"
                >
                  {r}
                </text>
              </g>
            )
          })}

          {/* Source nodes */}
          {sources.map((s, idx) => {
            const p = sourcePositions.get(s.id)!
            const color =
              s.category === 'science'
                ? 'oklch(0.55 0.16 145)'
                : s.category === 'museum'
                ? 'oklch(0.60 0.18 280)'
                : s.category === 'academic'
                ? 'oklch(0.55 0.18 18)'
                : 'oklch(0.65 0.20 350)'
            return (
              <g key={s.id || `src-${idx}`}>
                <rect
                  x={p.x - 7}
                  y={p.y - 7}
                  width={14}
                  height={14}
                  fill={color}
                  stroke="oklch(0.97 0.018 80)"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x - 14}
                  y={p.y + 3.5}
                  className="text-[10px]"
                  fill="oklch(0.22 0.04 30)"
                  textAnchor="end"
                >
                  {s.title.length > 35 ? s.title.slice(0, 33) + '...' : s.title}
                </text>
                <text
                  x={p.x - 14}
                  y={p.y + 14}
                  className="text-[9px]"
                  fill="oklch(0.45 0.03 30)"
                  textAnchor="end"
                >
                  {s.domain}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'oklch(0.55 0.18 18)' }} />
          Scripture (circle)
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3" style={{ background: 'oklch(0.60 0.18 280)' }} />
          Source (square)
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-6 h-0.5" style={{ background: 'oklch(0.55 0.16 145)' }} />
          supports
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-6 h-0.5" style={{ background: 'oklch(0.55 0.22 22)' }} />
          challenges
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'oklch(0.72 0.12 75)' }} />
          cross-reference
        </div>
      </div>
    </div>
  )
}

// ── Timeline View ────────────────────────────────────────────────────────────

interface TimelineItem {
  date: string
  label: string
  detail: string
  category: 'scripture' | 'evidence' | 'cross-ref'
}

function TimelineView({
  evidence,
  crossRefs,
}: {
  evidence: Evidence[]
  crossRefs: CrossRef[]
}) {
  const items: TimelineItem[] = []

  // Scripture composition dates (approximate, from book metadata)
  const scriptureDates: Record<string, { date: number; label: string }> = {
    '1-enoch': { date: -200, label: '1 Enoch composed (Aramaic)' },
    'jubilees': { date: -155, label: 'Jubilees composed' },
    genesis: { date: -550, label: 'Genesis (final redaction)' },
  }
  for (const [slug, info] of Object.entries(scriptureDates)) {
    items.push({
      date: String(info.date),
      label: info.label,
      detail: `${slug} — composition era based on internal evidence and DSS finds`,
      category: 'scripture',
    })
  }

  // Evidence with dates
  for (const e of evidence) {
    if (e.source?.publishedAt) {
      items.push({
        date: new Date(e.source.publishedAt).toISOString().slice(0, 4),
        label: e.source.title.slice(0, 80),
        detail: `Evidence linked to ${e.scriptureRef} — ${e.alignment}`,
        category: 'evidence',
      })
    }
  }

  // Sort by date ascending
  items.sort((a, b) => parseInt(a.date) - parseInt(b.date))

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No dated items yet. Evidence with publication dates will appear here.
      </p>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Chronological view: when scripture was composed, when corroborating evidence was
        discovered/published. Scroll horizontally if needed.
      </p>
      <div className="relative pl-6 border-l-2 border-accent/40 space-y-4">
        {items.map((item, idx) => {
          const color =
            item.category === 'scripture'
              ? 'bg-primary'
              : item.category === 'evidence'
              ? 'bg-accent'
              : 'bg-muted-foreground'
          return (
            <div key={idx} className="relative">
              <div
                className={`absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 border-background ${color}`}
              />
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono font-semibold text-accent min-w-[60px]">
                  {parseInt(item.date) < 0 ? `${Math.abs(parseInt(item.date))} BCE` : item.date}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-[68px]">{item.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
