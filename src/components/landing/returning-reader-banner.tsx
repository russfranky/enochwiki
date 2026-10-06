'use client'

import { useState, useSyncExternalStore } from 'react'
import s from './landing.module.css'

const SEEN_KEY = 'enochwiki.reader-seen'
const DISMISSED_KEY = 'enochwiki.reader-banner-dismissed'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getSnapshot(): boolean {
  try {
    return Boolean(window.localStorage.getItem(SEEN_KEY)) && !window.localStorage.getItem(DISMISSED_KEY)
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

// Shown only to visitors who have used the reader before. The app moved
// from / to /read; this banner routes returning readers past the landing
// page so old / bookmarks keep working in one click.
export function ReturningReaderBanner() {
  const eligible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [dismissed, setDismissed] = useState(false)

  if (!eligible || dismissed) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className={s.returning} role="note" aria-label="Reader moved notice" aria-live="polite">
      <p>
        Looking for the reader?{' '}
        <a href="/read">
          Open the reader <span aria-hidden="true">→</span>
        </a>
      </p>
      <button type="button" className={s['returning-x']} onClick={dismiss} aria-label="Dismiss notice">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
