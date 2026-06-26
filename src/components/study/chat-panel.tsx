'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2, Send, Sparkles, BookOpen, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

interface ChatPanelProps {
  context: string // currently selected scripture ref + text
}

export function ChatPanel({ context }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chat')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history)) {
          setMessages(d.history)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMsg = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Chat failed')
      }
      const data = await res.json()
      // Replace from server history (last 2 = the saved user + assistant)
      if (Array.isArray(data.history)) {
        // Deduplicate by id (server returns the canonical records)
        const seen = new Set<string>()
        const unique = data.history.filter((m: ChatMsg) => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
        setMessages(unique.reverse())
      } else if (data.reply) {
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            createdAt: new Date().toISOString(),
          },
        ])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function clearHistory() {
    if (!confirm('Clear all chat history? This cannot be undone.')) return
    await fetch('/api/chat', { method: 'DELETE' })
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-serif text-lg font-semibold">AI Study Tutor</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-8 px-2">
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm leading-relaxed">
              Ask anything about the Ethiopian Bible, Enoch, Jubilees, the Watchers, the Nephilim, the
              flood, the 364-day calendar — or how scripture parallels real-world evidence.
            </p>
            <p className="text-xs mt-3 italic">
              The tutor pursues truth without bias. It presents traditional, scholarly, and
              scientific perspectives side by side.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 text-left">
              {[
                'Why did the Watchers descend to Mount Hermon?',
                'What is the historical basis for the Nephilim?',
                'How does 1 Enoch 1:9 connect to Jude 14-15?',
                'What archaeological evidence supports the 364-day calendar?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-secondary/60 transition text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={`${m.id}-${idx}`}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-lg px-3 py-2 sm:px-3.5 sm:py-2.5 ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose-enoch">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              )}
              <div
                className={`text-[10px] mt-1.5 opacity-60 ${
                  m.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span>Seeking truth across scripture and evidence...</span>
            </div>
          </div>
        )}

        {error && (
          <Card className="p-3 border-destructive bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}
      </div>

      <div className="border-t border-border p-3 bg-secondary/30">
        {context && (
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] bg-accent/20 border-accent/40">
              <BookOpen className="h-3 w-3 mr-1" />
              {context.split('\n')[0]}
            </Badge>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask, question, or seek..."
            className="min-h-[60px] max-h-[180px] resize-y text-sm"
            disabled={loading}
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-[60px] w-12"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          ⌘+Enter to send • The tutor cites sources and presents multiple perspectives
        </p>
      </div>
    </div>
  )
}
