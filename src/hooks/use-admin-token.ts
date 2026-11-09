'use client'

// The admin-token gate machine: the single named definition.
//
// The token storage itself lives in @/lib/admin-token (memory +
// sessionStorage). Around it, the admin page and the review dashboard
// each hand-rolled the same React state: a tokenInput field, a hasToken
// flag, a save action (store the input, set the flag, clear the field),
// and a clear action (store empty, drop the flag, clear the field).
// This hook is that machine, once. Save/clear semantics are copied
// verbatim from the two call sites; the dashboard additionally calls its
// load() after save/clear, which stays at the call site.

import { useCallback, useState } from 'react'
import { getAdminToken, setAdminToken } from '@/lib/admin-token'

export interface UseAdminToken {
  tokenInput: string
  setTokenInput: (value: string) => void
  hasToken: boolean
  saveToken: () => void
  clearToken: () => void
}

export function useAdminToken(): UseAdminToken {
  const [tokenInput, setTokenInput] = useState('')
  const [hasToken, setHasToken] = useState(() => !!getAdminToken())

  const saveToken = useCallback(() => {
    setAdminToken(tokenInput)
    setHasToken(!!tokenInput.trim())
    setTokenInput('')
  }, [tokenInput])

  const clearToken = useCallback(() => {
    setAdminToken('')
    setHasToken(false)
    setTokenInput('')
  }, [])

  return { tokenInput, setTokenInput, hasToken, saveToken, clearToken }
}
