'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, BookOpen, Copy } from 'lucide-react'

interface Verse {
  id: string
  verseNum: number
  text: string
  geezText?: string | null
  ref: string
  themes: { slug: string; name: string; weight: number }[]
}

interface Chapter {
  id: string
  number: number
  title: string | null
}

interface Book {
  id: string
  slug: string
  name: string
  geezName: string | null
  amharicName: string | null
  category: string
  canon: string
  order: number
  author: string | null
  dateRange: string | null
  summary: string | null
  chapters: { id: string; number: number; title: string | null }[]
}

interface ScriptureReaderProps {
  onVerseSelect: (ref: string, text: string, context: string) => void
  selectedVerseRef: string | null
  selectedThemeSlug: string | null
  onClearTheme: () => void
  onChapterChange?: (bookSlug: string, chapterNum: number) => void
}

export function ScriptureReader({
  onVerseSelect,
  selectedVerseRef,
  selectedThemeSlug,
  onClearTheme,
  onChapterChange,
}: ScriptureReaderProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredVerse, setHoveredVerse] = useState<string | null>(null)

  // Load books on mount
  useEffect(() => {
    fetch('/api/scripture')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.books)) {
          setBooks(d.books)
          if (d.books.length > 0) {
            setSelectedBookSlug(d.books[0].slug)
            setSelectedChapter(d.books[0].chapters[0]?.number ?? 1)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Load verses when book/chapter changes
  useEffect(() => {
    if (!selectedBookSlug) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const r = await fetch(`/api/scripture?book=${selectedBookSlug}&chapter=${selectedChapter}`)
        const d = await r.json()
        if (cancelled) return
        setChapter(d.chapter || null)
        setVerses(Array.isArray(d.verses) ? d.verses : [])
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedBookSlug, selectedChapter])

  // Theme-filter view: load all verses for the selected theme
  useEffect(() => {
    if (!selectedThemeSlug) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const r = await fetch(`/api/themes?slug=${selectedThemeSlug}`)
        const d = await r.json()
        if (cancelled) return
        if (d.verses) {
          setVerses(
            d.verses.map((v: any) => ({
              id: v.id,
              verseNum: v.verseNum,
              text: v.text,
              ref: v.ref,
              themes: [{ slug: selectedThemeSlug, name: d.theme?.name ?? selectedThemeSlug, weight: v.weight }],
            })),
          )
          setChapter(null)
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedThemeSlug])

  // Notify parent when book/chapter changes
  useEffect(() => {
    if (onChapterChange && selectedBookSlug && selectedChapter) {
      onChapterChange(selectedBookSlug, selectedChapter)
    }
  }, [selectedBookSlug, selectedChapter, onChapterChange])

  const currentBook = books.find((b) => b.slug === selectedBookSlug)

  function navigateChapter(delta: number) {
    if (!currentBook) return
    const chapters = currentBook.chapters
    const idx = chapters.findIndex((c) => c.number === selectedChapter)
    const newIdx = idx + delta
    if (newIdx >= 0 && newIdx < chapters.length) {
      setSelectedChapter(chapters[newIdx].number)
    }
  }

  function handleVerseClick(v: Verse) {
    const context = `${v.ref}\n\n"${v.text}"`
    onVerseSelect(v.ref, v.text, context)
  }

  function copyVerse(v: Verse) {
    navigator.clipboard.writeText(`${v.ref} — "${v.text}"`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — book + chapter selector */}
      <div className="border-b border-border bg-secondary/40 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-accent flex-shrink-0" />
            <h3 className="font-serif text-base sm:text-lg font-semibold truncate">Sacred Text</h3>
          </div>
          {selectedThemeSlug && (
            <Button variant="outline" size="sm" onClick={onClearTheme} className="h-7 text-xs flex-shrink-0">
              Clear
            </Button>
          )}
        </div>

        {!selectedThemeSlug && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Select value={selectedBookSlug} onValueChange={setSelectedBookSlug}>
              <SelectTrigger className="h-8 text-sm flex-1 min-w-[140px]">
                <SelectValue placeholder="Book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((b) => (
                  <SelectItem key={b.slug} value={b.slug}>
                    <span className="font-serif">{b.name}</span>
                    {b.geezName && (
                      <span className="text-xs text-muted-foreground ml-2">{b.geezName}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentBook && (
              <Select
                value={String(selectedChapter)}
                onValueChange={(v) => setSelectedChapter(parseInt(v, 10))}
              >
                <SelectTrigger className="h-8 text-sm w-[100px] sm:w-[110px] flex-shrink-0">
                  <SelectValue placeholder="Chapter" />
                </SelectTrigger>
                <SelectContent>
                  {currentBook.chapters.map((c) => (
                    <SelectItem key={c.id} value={String(c.number)}>
                      Chapter {c.number}
                      {c.title && (
                        <span className="text-xs text-muted-foreground ml-1">— {c.title.slice(0, 30)}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateChapter(-1)}
              disabled={!currentBook || selectedChapter === currentBook.chapters[0]?.number}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateChapter(1)}
              disabled={
                !currentBook ||
                selectedChapter === currentBook.chapters[currentBook.chapters.length - 1]?.number
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {selectedThemeSlug && (
          <div className="text-sm">
            <span className="text-muted-foreground">Filtering by theme:</span>{' '}
            <span className="font-serif font-semibold capitalize">
              {selectedThemeSlug.replace(/-/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Book metadata */}
      {currentBook && !selectedThemeSlug && (
        <div className="px-3 sm:px-4 py-2 border-b border-border bg-card/50 text-xs">
          <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-muted-foreground">
            <span>
              <strong className="text-foreground">Canon:</strong> {currentBook.canon}
            </span>
            <span>
              <strong className="text-foreground">Category:</strong> {currentBook.category}
            </span>
            {currentBook.dateRange && (
              <span>
                <strong className="text-foreground">Date:</strong> {currentBook.dateRange}
              </span>
            )}
            {currentBook.author && (
              <span>
                <strong className="text-foreground">Author:</strong> {currentBook.author}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Verses */}
      <ScrollArea className="flex-1 parchment-bg">
        <div className="px-3 sm:px-5 py-3 sm:py-4 max-w-3xl mx-auto">
          {chapter?.title && !selectedThemeSlug && (
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-primary mb-3 pb-2 border-b border-border">
              {chapter.title}
            </h2>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : verses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No verses found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {verses.map((v, idx) => (
                <div
                  key={v.id}
                  onMouseEnter={() => setHoveredVerse(v.ref)}
                  onMouseLeave={() => setHoveredVerse(null)}
                  onClick={() => handleVerseClick(v)}
                  className={`group relative cursor-pointer rounded-md px-3 py-2 transition-colors ${
                    selectedVerseRef === v.ref
                      ? 'bg-accent/15 border border-accent/40'
                      : 'hover:bg-secondary/60 border border-transparent'
                  } ${idx === 0 && !selectedThemeSlug ? 'drop-cap' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-accent mt-1.5 select-none min-w-[28px] text-right">
                      {v.verseNum}
                    </span>
                    <p className="flex-1 text-[0.95rem] leading-relaxed">{v.text}</p>
                  </div>

                  {v.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-10">
                      {v.themes.map((t) => (
                        <Badge
                          key={t.slug}
                          variant="outline"
                          className="text-[9px] py-0 px-1.5 h-4 border-accent/40 text-accent-foreground bg-accent/10"
                        >
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Hover toolbar */}
                  <div
                    className={`absolute top-1 right-1 flex gap-1 transition-opacity ${
                      hoveredVerse === v.ref ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyVerse(v)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-0.5 ml-10 font-mono">
                    {v.ref}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
