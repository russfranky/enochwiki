'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Globe,
  FileText,
  ShieldCheck,
  Scale,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Calendar,
  Tag,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface TopicPage {
  slug: string
  title: string
  subtitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  bodyMarkdown: string
  filmRelevance: string | null
  canonicalRefs: string | null
  reviewState: string
  publishedAt: string | null
  articles: any[]
  perspectiveSpread: string[]
}

export function PublicSite() {
  const [topics, setTopics] = useState<TopicPage[]>([])
  const [allTopics, setAllTopics] = useState<TopicPage[]>([])
  const [selected, setSelected] = useState<TopicPage | null>(null)
  const [transparency, setTransparency] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUnpublished, setShowUnpublished] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [pubRes, allRes, transRes] = await Promise.all([
          fetch('/api/public?list=topics').then((r) => r.json()),
          fetch('/api/public?list=topics&includeDrafts=1').then((r) => r.json()).catch(() => ({ topics: [] })),
          fetch('/api/public').then((r) => r.json()),
        ])
        if (cancelled) return
        setTopics(pubRes.topics || [])
        setAllTopics(allRes.topics || pubRes.topics || [])
        setTransparency(transRes.transparency)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [showUnpublished])

  async function viewTopic(slug: string) {
    const d = await fetch(`/api/public?slug=${slug}`).then((r) => r.json())
    setSelected(d.topicPage)
  }

  const displayTopics = showUnpublished ? allTopics : topics

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-secondary/40 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <span>Public Resource Site</span>
            <span className="text-accent font-mono text-sm">enoch.wiki</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            What the post-release search audience will see. Only approved content is published to enoch.wiki.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnpublished((s) => !s)}
            className="h-7 text-xs"
          >
            {showUnpublished ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showUnpublished ? 'Hide drafts' : 'Show drafts'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Topic list — full width on mobile, sidebar on desktop */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border flex flex-col max-h-56 md:max-h-none">
          <div className="px-3 py-2 border-b border-border bg-secondary/30">
            <h4 className="text-xs font-semibold">Topic Landing Pages</h4>
            <p className="text-[10px] text-muted-foreground">SEO-optimized pages for film-relevant concepts</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {loading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : displayTopics.length === 0 ? (
                <div className="text-[10px] text-center py-4 text-muted-foreground px-2">
                  No topics approved yet. Use the Review tab to approve TopicPage drafts first.
                </div>
              ) : (
                displayTopics.map((t) => (
                  <Card
                    key={t.slug}
                    onClick={() => viewTopic(t.slug)}
                    className={`p-2.5 cursor-pointer transition ${
                      selected?.slug === t.slug
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.reviewState === 'approved' ? (
                        <ShieldCheck className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-amber-600 flex-shrink-0" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {t.reviewState}
                      </span>
                    </div>
                    <div className="text-xs font-serif font-medium leading-snug">{t.title}</div>
                    {t.subtitle && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.subtitle}</div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content view */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                {/* SEO preview */}
                <Card className="p-3 mb-4 bg-secondary/30 border-dashed">
                  <div className="text-[10px] text-muted-foreground mb-1">Search engine preview · enoch.wiki</div>
                  <div className="text-blue-700 text-base font-medium">{selected.title}</div>
                  <div className="text-emerald-700 text-xs">https://enoch.wiki/topics/{selected.slug}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selected.seoDescription}</div>
                </Card>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] ${
                    selected.reviewState === 'approved'
                      ? 'tag-historically-corroborated'
                      : 'tag-contested-minority'
                  }`}>
                    {selected.reviewState === 'approved' ? (
                      <><ShieldCheck className="h-3 w-3 mr-1" />Approved · enoch.wiki</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" />Draft — not published to enoch.wiki</>
                    )}
                  </Badge>
                  {selected.perspectiveSpread.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      <Tag className="h-3 w-3 mr-1" />
                      {selected.perspectiveSpread.length} perspectives
                    </Badge>
                  )}
                  {selected.canonicalRefs && (
                    <Badge variant="outline" className="text-[10px]">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {selected.canonicalRefs.split('|').length} scripture refs
                    </Badge>
                  )}
                  {selected.publishedAt && (
                    <Badge variant="outline" className="text-[10px]">
                      <Calendar className="h-3 w-3 mr-1" />
                      Published {new Date(selected.publishedAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <h1 className="font-serif text-3xl font-bold mb-1">{selected.title}</h1>
                {selected.subtitle && (
                  <p className="text-lg text-muted-foreground mb-4 italic">{selected.subtitle}</p>
                )}

                {selected.filmRelevance && (
                  <Card className="p-3 mb-4 bg-accent/5 border-accent/30">
                    <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Film Relevance
                    </div>
                    <p className="text-sm">{selected.filmRelevance}</p>
                  </Card>
                )}

                <div className="prose-enoch">
                  <ReactMarkdown>{selected.bodyMarkdown}</ReactMarkdown>
                </div>

                {selected.articles.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="font-serif text-lg font-semibold mb-3">Related Articles</h3>
                    <div className="space-y-2">
                      {selected.articles.map((a: any) => (
                        <Card key={a.id} className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-serif font-medium text-sm">{a.title}</h4>
                            {a.claimTypeSlug && (
                              <Badge variant="outline" className="text-[9px]">{a.claimTypeSlug}</Badge>
                            )}
                          </div>
                          {a.subtitle && <p className="text-xs text-muted-foreground">{a.subtitle}</p>}
                          <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            <span>Corroboration: {(a.corroborationScore * 100).toFixed(0)}%</span>
                            <span>Sources: {a.sourcesCount}</span>
                            <span>Perspectives: {a.perspectivesCount}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : transparency ? (
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <h1 className="font-serif text-3xl font-bold mb-2">How Enoch.Wiki Vets Content</h1>
                <p className="text-muted-foreground mb-6">
                  Enoch.Wiki holds itself to a public-authority standard. Nothing is presented as
                  authoritative until it clears editorial review. Every public item displays its
                  sources, perspective tags, claim-type label, and corroboration score.
                </p>

                <Card className="p-3 sm:p-4 mb-4">
                  <h2 className="font-serif text-lg font-semibold mb-2 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-accent" />
                    Credibility Tiers
                  </h2>
                  <div className="space-y-2">
                    {transparency.credibilityTiers.map((t: any) => (
                      <div key={t.slug} className="text-sm">
                        <strong>{t.name}</strong>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 mb-4">
                  <h2 className="font-serif text-lg font-semibold mb-2">Perspective / Tradition Tags</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Every claim is tagged with the traditions that hold it. A claim backed by one tradition
                    reads very differently from one backed across many.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {transparency.perspectiveTags.map((p: any) => (
                      <div key={p.slug} className="text-xs p-2 rounded border border-border">
                        <div className="font-medium flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 mb-4">
                  <h2 className="font-serif text-lg font-semibold mb-2">Claim Type Labels</h2>
                  <div className="space-y-2">
                    {transparency.claimTypes.map((c: any) => (
                      <div key={c.slug} className="text-sm">
                        <strong>{c.name}</strong>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 mb-4">
                  <h2 className="font-serif text-lg font-semibold mb-2">Review Rubric</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    An item cannot publish until it passes every check:
                  </p>
                  <ul className="space-y-1 text-sm">
                    {transparency.reviewRubric.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-4">
                  <h2 className="font-serif text-lg font-semibold mb-2">Content Lifecycle</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {transparency.reviewStates.map((s: any) => (
                      <Badge key={s.slug} variant="outline" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
