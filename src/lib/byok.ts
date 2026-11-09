// Bring your own key (BYOK) — client-side store, mirroring the admin-token
// pattern (src/lib/admin-token.ts): the config lives in module memory for
// the page session and is mirrored to sessionStorage (same tab only). It is
// NEVER sent anywhere except this origin's own API routes, NEVER logged,
// and NEVER rendered into the DOM. byokHeaders() attaches it to AI fetch
// calls; the server uses it for that request only and stores nothing.
// Design: ~/workspace/enochwiki-notes/byok-map.md.

export interface ByokProviderPreset {
  id: string
  name: string
  baseUrl: string
  authStyle: 'api-key' | 'bearer'
  defaultModel: string
  custom?: boolean
}

export const BYOK_PROVIDERS: ByokProviderPreset[] = [
  { id: 'mimo-token-plan', name: 'Xiaomi MiMo (Token Plan)', baseUrl: 'https://token-plan-sgp.xiaomimimo.com/v1', authStyle: 'api-key', defaultModel: 'mimo-v2.6-flash' },
  { id: 'mimo-payg', name: 'Xiaomi MiMo', baseUrl: 'https://api.xiaomimimo.com/v1', authStyle: 'api-key', defaultModel: 'mimo-v2.6-flash' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', authStyle: 'bearer', defaultModel: 'gpt-4o-mini' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', authStyle: 'bearer', defaultModel: 'deepseek-chat' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', authStyle: 'bearer', defaultModel: 'openai/gpt-4o-mini' },
  { id: 'custom', name: 'Custom endpoint', baseUrl: '', authStyle: 'bearer', defaultModel: '', custom: true },
]

export interface ByokConfig {
  providerId: string
  key: string
  baseUrl: string
  model: string
  authStyle: 'api-key' | 'bearer'
}

const STORAGE_KEY = 'enoch-byok'

let memoryConfig: ByokConfig | null = null

export function getByokConfig(): ByokConfig | null {
  if (memoryConfig) return memoryConfig
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw) memoryConfig = JSON.parse(raw) as ByokConfig
  } catch {
    memoryConfig = null
  }
  return memoryConfig
}

export function setByokConfig(config: ByokConfig | null): void {
  memoryConfig = config
  if (typeof window === 'undefined') return
  try {
    if (config) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable (private mode): memory-only for this page session
  }
}

/** Headers for an AI fetch call. Empty object when no key is configured. */
export function byokHeaders(): Record<string, string> {
  const c = getByokConfig()
  if (!c || !c.key) return {}
  return {
    'x-byok-key': c.key,
    'x-byok-base-url': c.baseUrl,
    'x-byok-model': c.model,
    'x-byok-auth': c.authStyle,
  }
}
