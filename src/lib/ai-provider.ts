// AI provider for Enoch Wiki — Xiaomi MiMo (Token Plan subscription).
//
// Owner direction 2026-09-21: use Xiaomi MiMo for all app AI (chat,
// summaries, RAG answers). This module is the single place that talks to
// the model; routes import chatCompletion() and never touch provider SDKs.
//
// Web search for the growth pipeline (src/lib/search-api.ts, scripts) runs on
// the pay-as-you-go track's native `web_search` tool: Token Plan endpoints do
// not support web search (verified 2026-09-21, webSearchEnabled is false).
// Page extraction runs on the Token Plan subscription (no marginal cost).
//
// Env:
//   MIMO_API_KEY   Token Plan key (tp-...). Required; never commit it.
//   MIMO_BASE_URL  Default https://token-plan-sgp.xiaomimimo.com/v1
//   MIMO_MODEL     Default mimo-v2.6-flash

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1'
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.6-flash'
const API_KEY = process.env.MIMO_API_KEY || ''

// Pay-as-you-go track: separate billing from the Token Plan subscription.
// Used ONLY for the native web_search tool, which Token Plan endpoints do not
// support (live-verified 2026-09-21: webSearchEnabled is false). Web search is
// billed per call on this track and needs the Web Search Plugin enabled in the
// MiMo console plus a funded account balance.
const PAYG_BASE_URL = process.env.MIMO_PAYG_BASE_URL || 'https://api.xiaomimimo.com/v1'
const PAYG_API_KEY = process.env.MIMO_PAYG_API_KEY || ''
const SEARCH_MODEL = process.env.MIMO_SEARCH_MODEL || 'mimo-v2.5'

export function mimoModel(): string {
  return MODEL
}

export function mimoConfigured(): boolean {
  return API_KEY.length > 0
}

export function mimoPaygConfigured(): boolean {
  return PAYG_API_KEY.length > 0
}

export function mimoSearchModel(): string {
  return SEARCH_MODEL
}

// --- Bring your own key (BYOK) -------------------------------------------
// A visitor may supply their own provider key per request (headers parsed
// by byokFromHeaders). The key is used for that request only: never stored,
// never logged. Design: ~/workspace/enochwiki-notes/byok-map.md.

export interface ProviderOverride {
  key: string
  baseUrl: string
  model: string
  authStyle: 'api-key' | 'bearer'
}

function overrideAuthHeaders(o: ProviderOverride): Record<string, string> {
  const headers: Record<string, string> = {}
  if (o.authStyle === 'api-key') headers['api-key'] = o.key
  else headers.Authorization = 'Bearer ' + o.key
  return headers
}

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '169.254.169.254'])

/**
 * Parse a BYOK override from request headers. Returns null when no key is
 * present or anything is invalid (callers then use the site provider).
 * Only https endpoints on public hosts are accepted.
 */
export function byokFromHeaders(req: { headers: { get(name: string): string | null } }): ProviderOverride | null {
  const rawKey = req.headers.get('x-byok-key')
  if (!rawKey) return null
  const key = rawKey.trim()
  if (!key || key.length > 512) return null
  const rawBase = req.headers.get('x-byok-base-url') || ''
  const model = (req.headers.get('x-byok-model') || '').trim()
  if (!model || model.length > 128) return null
  let url: URL
  try {
    url = new URL(rawBase)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  if (BLOCKED_HOSTS.has(url.hostname) || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal')) return null
  const authStyle = req.headers.get('x-byok-auth') === 'api-key' ? 'api-key' : 'bearer'
  return { key, baseUrl: rawBase.replace(/\/+$/, ''), model, authStyle }
}

/** One chat completion. Site provider by default; opts.provider (BYOK) overrides it for this call. Returns the reply text, or null on empty. Throws on HTTP errors. */
export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number; timeoutMs?: number; provider?: ProviderOverride }
): Promise<string | null> {
  const o = opts?.provider
  if (!o && !API_KEY) return null
  const baseUrl = o ? o.baseUrl : BASE_URL
  const model = o ? o.model : MODEL
  const headers: Record<string, string> = o
    ? { 'Content-Type': 'application/json', ...overrideAuthHeaders(o) }
    : { 'Content-Type': 'application/json', 'api-key': API_KEY }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      ...(opts?.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      ...(opts?.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? 55_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${o ? 'Provider' : 'MiMo'} chat ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  return typeof content === 'string' && content.length > 0 ? content : null
}

/** Liveness probe. Site provider by default; pass a BYOK override to test a visitor key. */
export async function checkAiHealth(override?: ProviderOverride): Promise<{ ok: boolean; error?: string; model?: string }> {
  if (override) {
    try {
      const res = await fetch(`${override.baseUrl}/models`, {
        headers: overrideAuthHeaders(override),
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) return { ok: false, error: `Provider models endpoint ${res.status}`, model: override.model }
      return { ok: true, model: override.model }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'unreachable', model: override.model }
    }
  }
  if (!API_KEY) return { ok: false, error: 'MIMO_API_KEY not set — AI features unavailable', model: MODEL }
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { 'api-key': API_KEY },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { ok: false, error: `MiMo models endpoint ${res.status}`, model: MODEL }
    return { ok: true, model: MODEL }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'unreachable', model: MODEL }
  }
}

export interface MimoSearchHit {
  url: string
  name: string
  snippet: string
}

/**
 * Native Xiaomi web search via the pay-as-you-go track's `web_search` tool.
 * Token Plan keys cannot use this (webSearchEnabled is false on token-plan
 * endpoints), so this always runs on the separate pay-as-you-go key.
 *
 * Returns hits, or null when search is unavailable: no key configured, the
 * account balance is empty (HTTP 402), or the Web Search Plugin is not
 * enabled in the MiMo console. Callers fall back to curated direct-fetch.
 */
export async function mimoWebSearch(query: string, num = 8): Promise<MimoSearchHit[] | null> {
  if (!PAYG_API_KEY) return null
  let res: Response
  try {
    res = await fetch(`${PAYG_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': PAYG_API_KEY },
      body: JSON.stringify({
        model: SEARCH_MODEL,
        messages: [
          {
            role: 'user',
            content: `Search the web for: ${query}\nList the most relevant sources with their URLs.`,
          },
        ],
        tools: [{ type: 'web_search', max_keyword: 3, force_search: true }],
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch {
    return null
  }
  if (!res.ok) {
    // 402 = empty pay-as-you-go balance; 400 = plugin not enabled or bad model.
    // Either way search is unavailable — the caller uses the free fallback.
    return null
  }
  const json = await res.json().catch(() => null)
  const message = json?.choices?.[0]?.message
  if (!message) return null

  const hits: MimoSearchHit[] = []
  const seen = new Set<string>()
  const push = (url: string, name: string, snippet: string) => {
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) return
    seen.add(url)
    hits.push({ url, name: name || url, snippet: snippet || '' })
  }

  // Structured citations from the web_search tool (url_citation annotations).
  const annotations = message.annotations
  if (Array.isArray(annotations)) {
    for (const a of annotations) {
      const c = a?.url_citation
      if (c?.url) push(c.url, c.title || '', '')
    }
  }
  // Backup: URLs mentioned in the answer text.
  const content = typeof message.content === 'string' ? message.content : ''
  const urls = content.match(/https?:\/\/[^\s"'<>\])]+/g) || []
  for (const url of urls) push(url.replace(/[.,;:!?]+$/, ''), '', '')

  return hits.slice(0, num)
}

export interface ExtractedEvidence {
  summary: string
  keyClaims: { claim: string; quote: string }[]
  verseRefs: string[]
}

/**
 * Extract structured evidence from fetched page text using the Token Plan
 * subscription (no marginal cost). This is the "reader intelligence" of the
 * scrape pipeline: raw HTML goes in, grounded claims come out.
 * Returns null when the Token Plan key is unset or the call fails.
 */
export async function mimoExtractEvidence(url: string, pageText: string): Promise<ExtractedEvidence | null> {
  if (!API_KEY || !pageText.trim()) return null
  const text = pageText.slice(0, 12000)
  const reply = await chatCompletion(
    [
      {
        role: 'system',
        content: `You extract research evidence from a web page for Enoch.Wiki, a rigorously corroborated knowledge resource on the Ethiopian Orthodox Tewahedo Bible and related sacred texts (1 Enoch, Jubilees, Dead Sea Scrolls, Second Temple literature).

Reply with ONLY a JSON object, no other text:
{
  "summary": "2-3 sentence summary of what this page contributes",
  "keyClaims": [{"claim": "one specific factual claim", "quote": "short verbatim quote supporting it, or empty string"}],
  "verseRefs": ["1 Enoch 6:2", ...] // scripture references the page mentions, empty array if none
}
Keep keyClaims to at most 5, most important first. Never invent quotes or references.`,
      },
      { role: 'user', content: `URL: ${url}\n\nPage text:\n${text}` },
    ],
    { maxTokens: 1500, temperature: 0.2 }
  ).catch(() => null)
  if (!reply) return null
  try {
    const json = JSON.parse(reply.replace(/^```json\s*|\s*```$/g, '').trim())
    return {
      summary: typeof json.summary === 'string' ? json.summary : '',
      keyClaims: Array.isArray(json.keyClaims)
        ? json.keyClaims
            .filter((c: any) => c && typeof c.claim === 'string')
            .slice(0, 5)
            .map((c: any) => ({ claim: c.claim, quote: typeof c.quote === 'string' ? c.quote : '' }))
        : [],
      verseRefs: Array.isArray(json.verseRefs) ? json.verseRefs.filter((v: any) => typeof v === 'string').slice(0, 10) : [],
    }
  } catch {
    return null
  }
}
