// In-memory daily spend guard for AI-backed endpoints (Xiaomi MiMo).
// Each AI endpoint gets a daily call budget. When the budget is spent,
// the caller must use the free fallback path instead of calling the provider.
// Single-process guard: enough for one-box deploys. Counts reset with the process.
//
// Env names are AI_DAILY_CAP_*; the legacy ZAI_DAILY_CAP_* names still work as fallback.

export type SpendEndpoint = 'chat' | 'rag' | 'summarize'

interface DayCount {
  day: string
  count: number
}

const counts = new Map<string, DayCount>()

const ENV_BY_ENDPOINT: Record<SpendEndpoint, string[]> = {
  chat: ['AI_DAILY_CAP_CHAT', 'ZAI_DAILY_CAP_CHAT'],
  rag: ['AI_DAILY_CAP_RAG', 'ZAI_DAILY_CAP_RAG'],
  summarize: ['AI_DAILY_CAP_SUMMARIZE', 'ZAI_DAILY_CAP_SUMMARIZE'],
}

const DEFAULT_CAP: Record<SpendEndpoint, number> = {
  chat: 200,
  rag: 200,
  summarize: 100,
}

export function spendCapFor(endpoint: SpendEndpoint): number {
  const raw = ENV_BY_ENDPOINT[endpoint]
    .map((name) => process.env[name])
    .find((v) => v !== undefined && v !== '')
  if (raw === undefined || raw === '') return DEFAULT_CAP[endpoint]
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return DEFAULT_CAP[endpoint]
  return n // 0 or negative means unlimited
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Record one paid call attempt. Returns true when the daily budget for the
 * endpoint is already spent (the caller must NOT call the AI provider).
 */
export function checkSpendCap(endpoint: SpendEndpoint): boolean {
  const cap = spendCapFor(endpoint)
  if (cap <= 0) return false
  const key = `${endpoint}:${todayKey()}`
  let entry = counts.get(key)
  if (!entry || entry.day !== todayKey()) {
    entry = { day: todayKey(), count: 0 }
    counts.set(key, entry)
  }
  if (entry.count >= cap) return true
  entry.count += 1
  return false
}
