'use client'

// Editorial console. Not linked from the public site and excluded from
// robots.txt. Every action here calls an admin-gated API; without the admin
// token the APIs refuse, and the tools stay hidden until a token is entered.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewDashboard } from '@/components/study/review-dashboard'
import { getAdminToken, setAdminToken, adminAuthHeaders } from '@/lib/admin-token'
import { ShieldCheck, Sprout, Download, Loader2, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const [tokenInput, setTokenInput] = useState('')
  const [hasToken, setHasToken] = useState(() => !!getAdminToken())
  const [growing, setGrowing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)


  async function growDatabase() {
    if (growing) return
    if (!confirm('This will run the corpus growth pipeline for all themes and film topics. It may take several minutes and consume search credits. Continue?')) return
    setGrowing(true)
    setNotice(null)
    try {
      const res = await fetch('/api/auto-grow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify({ mode: 'all', limit: 8 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotice({ ok: false, text: data.error || 'Auto-grow failed' })
      } else {
        setNotice({ ok: true, text: `Grew database: +${data.sourcesAdded} sources, +${data.evidenceAdded} evidence records. Processed ${data.processed} items.` })
      }
    } catch (e: any) {
      setNotice({ ok: false, text: `Error: ${e.message}` })
    } finally {
      setGrowing(false)
    }
  }

  async function exportBackup() {
    if (exporting) return
    setExporting(true)
    setNotice(null)
    try {
      const res = await fetch('/api/export', { headers: adminAuthHeaders() })
      const contentType = res.headers.get('content-type') || ''
      const data = await res.json().catch(() => null)
      const serverError =
        !res.ok || !contentType.includes('application/json') || !data || (data as any).error
      if (serverError) {
        setNotice({ ok: false, text: (data as any)?.error || `Export failed (HTTP ${res.status}). Check the admin token.` })
        return
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ethiopian-bible-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setNotice({ ok: true, text: 'Backup downloaded.' })
    } catch (e: any) {
      setNotice({ ok: false, text: `Export failed: ${e.message}` })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="font-serif text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Editorial console
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Internal tools. Not linked from the public site.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasToken ? (
              <>
                <Badge variant="outline" className="text-[10px]">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  admin session active
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdminToken('')
                    setHasToken(false)
                    setTokenInput('')
                  }}
                >
                  Clear token
                </Button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAdminToken(tokenInput)
                      setHasToken(!!tokenInput.trim())
                      setTokenInput('')
                    }
                  }}
                  placeholder="Admin token"
                  className="h-8 px-2 text-xs rounded border border-input bg-background w-40"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAdminToken(tokenInput)
                    setHasToken(!!tokenInput.trim())
                    setTokenInput('')
                  }}
                >
                  Use token
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {notice && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${notice.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
          {!notice.ok && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />}
          <span className={`text-xs flex-1 ${notice.ok ? 'text-emerald-700' : 'text-muted-foreground'}`}>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="text-muted-foreground hover:text-foreground text-xs">Dismiss</button>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {!hasToken ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="p-6 max-w-sm text-center">
              <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h2 className="font-serif text-lg font-semibold mb-1">Admin token required</h2>
              <p className="text-xs text-muted-foreground">
                Enter the admin token above to use the review queue, corpus growth, and export tools.
              </p>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="review" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3">
              <TabsList>
                <TabsTrigger value="review">Review queue</TabsTrigger>
                <TabsTrigger value="tools">Corpus tools</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="review" className="flex-1 overflow-hidden mt-0">
              <ReviewDashboard />
            </TabsContent>
            <TabsContent value="tools" className="flex-1 overflow-auto p-4">
              <div className="max-w-2xl space-y-3">
                <Card className="p-4">
                  <h3 className="font-serif font-semibold mb-1 flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-accent" />
                    Grow the corpus
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Runs the corroboration pipeline across all themes and film topics. Takes several
                    minutes and consumes search credits.
                  </p>
                  <Button onClick={growDatabase} disabled={growing} size="sm">
                    {growing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sprout className="h-3.5 w-3.5 mr-1.5" />}
                    {growing ? 'Growing…' : 'Grow database'}
                  </Button>
                </Card>
                <Card className="p-4">
                  <h3 className="font-serif font-semibold mb-1 flex items-center gap-2">
                    <Download className="h-4 w-4 text-accent" />
                    Export backup
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Downloads a full JSON backup of the database.
                  </p>
                  <Button onClick={exportBackup} disabled={exporting} size="sm" variant="outline">
                    {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                    {exporting ? 'Exporting…' : 'Download backup'}
                  </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
