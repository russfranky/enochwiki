'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Layers, Loader2 } from 'lucide-react'

interface Theme {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  verseCount: number
}

interface ThemeExplorerProps {
  onSelectTheme: (slug: string) => void
  selectedThemeSlug: string | null
}

export function ThemeExplorer({ onSelectTheme, selectedThemeSlug }: ThemeExplorerProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((d) => setThemes(d.themes || []))
      .finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(themes.map((t) => t.category)))
  const filtered = categoryFilter
    ? themes.filter((t) => t.category === categoryFilter)
    : themes

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-secondary/40">
        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          Themes &amp; Threads
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Common patterns across scripture
        </p>
      </div>

      <div className="px-3 sm:px-4 py-2 border-b border-border flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
            categoryFilter === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-secondary'
          }`}
        >
          All ({themes.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
              categoryFilter === c
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 sm:px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading themes...
            </div>
          ) : (
            filtered.map((t) => (
              <Card
                key={t.id}
                onClick={() => onSelectTheme(t.slug === selectedThemeSlug ? '' : t.slug)}
                className={`p-3 cursor-pointer transition-all ${
                  t.slug === selectedThemeSlug
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border hover:border-accent/50 hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-serif font-semibold text-sm">{t.name}</div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {t.description.length > 110
                          ? t.description.slice(0, 108) + '...'
                          : t.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] flex-shrink-0">
                    {t.verseCount} v.
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5 italic">
                  {t.category}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
