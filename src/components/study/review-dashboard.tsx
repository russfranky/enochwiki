'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Archive,
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  ScrollText,
  Loader2,
} from 'lucide-react'

interface ReviewItem {
  id: string
  itemType: 'evidence' | 'public-article' | 'topic-page' | 'source'
  itemId: string
  state: string
  reviewer: string
  reviewerRole: string
  checklist: string | null
  notes: string | null
  version: number
  updatedAt: string
  item: any
}

interface AuditEntry {
  id: string
  action: string
  itemType: string
  itemId: string
  actor: string
  actorRole: string
  details: string | null
  createdAt: string
}

const STATE_COLORS: Record<string, string> = {
  draft: 'tag-speculative',
  'auto-corroborated': 'tag-scholarly-consensus',
  'in-review': 'tag-contested-minority',
  approved: 'tag-historically-corroborated',
  rejected: 'tag-contested-minority',
  'needs-revision': 'tag-contested-minority',
  archived: 'tag-speculative',
}

export function ReviewDashboard() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('auto-corroborated')
  const [selected, setSelected] = useState<ReviewItem | null>(null)
  const [reviewer, setReviewer] = useState('editor')
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)

  async function load() {
    setLoading(true)
    const url = filter === 'all' ? '/api/review' : `/api/review?state=${filter}`
    const d = await fetch(url).then((r) => r.json())
    setItems(d.queue || [])
    setAuditLog(d.auditLog || [])
    setCounts(d.counts || {})
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter])

  async function act(action: 'submit-review' | 'approve' | 'reject' | 'request-revision' | 'archive') {
    if (!selected) return
    setActing(true)
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: selected.itemType,
          itemId: selected.itemId,
          action,
          reviewer,
          reviewerRole: 'reviewer',
          notes,
        }),
      })
      setNotes('')
      await load()
      setSelected(null)
    } finally {
      setActing(false)
    }
  }

  async function publishItem() {
    if (!selected) return
    setActing(true)
    try {
      const r = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: selected.itemType, itemId: selected.itemId }),
      })
      const d = await r.json()
      if (!r.ok) {
        alert(d.error || 'Publish failed')
      } else {
        alert(`Published as: ${d.article?.slug}`)
      }
      await load()
    } finally {
      setActing(false)
    }
  }

  const checklist = selected?.checklist ? JSON.parse(selected.checklist) : null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-secondary/40 px-4 py-3">
        <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          Editorial Review Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          The gate. Nothing reaches the public site until it passes review here.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Queue */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-64 md:max-h-none">
          <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1.5">
            {[
              { k: 'all', label: 'All', count: Object.values(counts).reduce((a, b) => a + b, 0) },
              { k: 'auto-corroborated', label: 'Pending', count: (counts['autoCorroborated'] || 0) + (counts['inReview'] || 0) },
              { k: 'approved', label: 'Approved', count: counts['approved'] || 0 },
              { k: 'rejected', label: 'Rejected', count: counts['rejected'] || 0 },
              { k: 'draft', label: 'Draft', count: counts['draft'] || 0 },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  filter === t.k
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {loading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">No items in this state.</p>
              ) : (
                items.map((it) => (
                  <Card
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`p-2 sm:p-2.5 cursor-pointer transition ${
                      selected?.id === it.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge variant="outline" className={`text-[9px] ${STATE_COLORS[it.state] || ''}`}>
                        {it.state}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">{it.itemType}</span>
                    </div>
                    <div className="text-xs font-medium truncate">
                      {it.itemType === 'evidence' && (
                        <>
                          {it.item?.scriptureRef} — <span className="text-muted-foreground">{it.item?.alignment}</span>
                        </>
                      )}
                      {it.itemType === 'topic-page' && <>{it.item?.title}</>}
                    </div>
                    {it.itemType === 'evidence' && it.item?.claim && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{it.item.claim}</p>
                    )}
                    <div className="text-[9px] text-muted-foreground mt-1">
                      v{it.version} · {new Date(it.updatedAt).toLocaleDateString()}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail / Review */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <ScrollArea className="flex-1">
              <div className="p-3 sm:p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] ${STATE_COLORS[selected.state] || ''}`}>
                      {selected.state}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {selected.itemType}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">v{selected.version}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold">
                    {selected.itemType === 'evidence' && selected.item?.scriptureRef}
                    {selected.itemType === 'topic-page' && selected.item?.title}
                  </h3>
                </div>

                {/* Checklist */}
                {checklist && (
                  <Card className="p-3 bg-secondary/30">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                      Review Checklist
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(checklist).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          {v ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-rose-600" />
                          )}
                          <span className={v ? '' : 'text-muted-foreground line-through'}>
                            {k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                    {selected.item?.blindspot && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Blindspot flagged:</strong> This item is backed by a single tradition or low-credibility source.
                          Reviewer must contextualize before publishing.
                        </span>
                      </div>
                    )}
                  </Card>
                )}

                {/* Item content */}
                {selected.itemType === 'evidence' && selected.item && (
                  <Card className="p-3">
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">Scripture</div>
                        <div className="font-mono text-xs">{selected.item.scriptureRef}</div>
                        {selected.item.scriptureText && (
                          <p className="text-xs italic text-muted-foreground mt-1">"{selected.item.scriptureText}"</p>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">Claim</div>
                        <p className="text-sm">{selected.item.claim}</p>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">Corroboration</div>
                        <p className="text-sm">{selected.item.corroboration}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">Alignment: {selected.item.alignment}</Badge>
                        <Badge variant="outline">Confidence: {(selected.item.confidence * 100).toFixed(0)}%</Badge>
                        {selected.item.source && (
                          <>
                            <Badge variant="outline">Source: {selected.item.source.title?.slice(0, 40)}</Badge>
                            <Badge variant="outline">Tier: {selected.item.source.credibilityTier}</Badge>
                            <Badge variant="outline">Credibility: {(selected.item.source.credibility * 100).toFixed(0)}%</Badge>
                          </>
                        )}
                      </div>
                      {selected.item.source && (
                        <a
                          href={selected.item.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent underline block"
                        >
                          {selected.item.source.url}
                        </a>
                      )}
                    </div>
                  </Card>
                )}

                {selected.itemType === 'topic-page' && selected.item && (
                  <Card className="p-3">
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">SEO Description</div>
                        <p className="text-xs">{selected.item.seoDescription}</p>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">Film Relevance</div>
                        <p className="text-xs">{selected.item.filmRelevance}</p>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">Body (preview)</div>
                        <pre className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto bg-secondary/30 p-2 rounded">
                          {selected.item.bodyMarkdown?.slice(0, 800)}...
                        </pre>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Reviewer actions */}
                <Card className="p-3 bg-secondary/30">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Reviewer:</span>
                      <input
                        type="text"
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                        className="h-7 px-2 text-xs rounded border border-input bg-background w-32"
                      />
                    </div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Review notes (optional)..."
                      className="min-h-[60px] text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="default" onClick={() => act('approve')} disabled={acting}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={acting}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act('request-revision')} disabled={acting}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Request Revision
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act('submit-review')} disabled={acting}>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Submit for Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => act('archive')} disabled={acting}>
                        <Archive className="h-3.5 w-3.5 mr-1" />
                        Archive
                      </Button>
                      {selected.state === 'approved' && (
                        <Button size="sm" variant="accent" onClick={publishItem} disabled={acting}>
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Publish to enoch.wiki
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {selected.notes && (
                  <Card className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Prior Notes</div>
                    <p className="text-xs">{selected.notes}</p>
                  </Card>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Select an item from the queue to review.</p>
              </div>
            </div>
          )}
        </div>

        {/* Audit log — hidden on mobile, shown on desktop */}
        <div className="hidden md:flex w-64 border-l border-border flex-col">
          <div className="px-3 py-2 border-b border-border bg-secondary/30">
            <h4 className="text-xs font-semibold">Audit Log</h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {auditLog.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">No actions yet.</p>
              ) : (
                auditLog.map((a) => (
                  <div key={a.id} className="text-[10px] p-1.5 rounded bg-card border border-border">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[8px] py-0 px-1 h-3.5">
                        {a.action}
                      </Badge>
                      <span className="text-muted-foreground">{a.itemType}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {a.actor} ({a.actorRole})
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
