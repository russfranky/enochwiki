// D-014: client-side admin token entry point for admin-gated UI fetches.
//
// The token lives in module memory for the page session and is mirrored to
// sessionStorage (same tab only) so it survives reloads during the session.
// It is NEVER written to disk beyond sessionStorage, NEVER logged, and
// NEVER rendered into the DOM. Use adminAuthHeaders() to attach it to
// admin-gated fetch calls as an Authorization Bearer token.
const STORAGE_KEY = 'enoch-admin-token'

let memoryToken: string | null = null

export function getAdminToken(): string | null {
  if (memoryToken) return memoryToken
  if (typeof window === 'undefined') return null
  try {
    memoryToken = window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    memoryToken = null
  }
  return memoryToken
}

export function setAdminToken(token: string): void {
  const t = token.trim() || null
  memoryToken = t
  if (typeof window === 'undefined') return
  try {
    if (t) window.sessionStorage.setItem(STORAGE_KEY, t)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage unavailable (private mode); memory token still applies
  }
}

// Returns an Authorization Bearer header when a token is present,
// otherwise an empty object so callers can spread it into headers.
export function adminAuthHeaders(): HeadersInit {
  const t = getAdminToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
