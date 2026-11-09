'use client'

// The async fetch machine: the single named definition.
//
// Before this hook, every data-loading component hand-rolled the same
// machine (a loading boolean, an optional error string, try/catch/finally)
// and several copies silently swallowed failures: the scripture reader
// rendered "No verses found" on a network error, the theme explorer and
// synergy view showed empty lists. This hook gives the machine one shape:
// status is idle | loading | success | error, error carries the message,
// and run() drives a promise through it. Callers keep their own data
// state; this hook owns only the status. Behavior of migrated call sites
// is unchanged except that failures now surface instead of vanishing.
//
// run() is latest-call-wins: a stale promise resolving after a newer call
// started does not move the status.

import { useCallback, useRef, useState } from 'react'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseAsync {
  status: AsyncStatus
  loading: boolean
  error: string | null
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>
  setError: (error: string | null) => void
  reset: () => void
}

export function useAsync(options?: { startInLoading?: boolean }): UseAsync {
  const [status, setStatus] = useState<AsyncStatus>(
    options?.startInLoading ? 'loading' : 'idle',
  )
  const [error, setErrorState] = useState<string | null>(null)
  const callRef = useRef(0)

  const setError = useCallback((next: string | null) => {
    setErrorState(next)
    if (next) setStatus('error')
  }, [])

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    const call = ++callRef.current
    setStatus('loading')
    setErrorState(null)
    try {
      const value = await fn()
      if (callRef.current === call) setStatus('success')
      return value
    } catch (e) {
      if (callRef.current === call) {
        setStatus('error')
        setErrorState(e instanceof Error ? e.message : 'Something went wrong')
      }
      return undefined
    }
  }, [])

  const reset = useCallback(() => {
    callRef.current++
    setStatus('idle')
    setErrorState(null)
  }, [])

  return { status, loading: status === 'loading', error, run, setError, reset }
}
