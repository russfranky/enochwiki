'use client'

// The BYOK settings machine: the single named definition, mirroring
// use-admin-token.ts. Holds the form state (provider, key input, base URL,
// model) around the storage in @/lib/byok, plus save/clear and a
// "test connection" probe that asks /api/byok-check to verify the key
// against the provider's /models endpoint.

import { useCallback, useState } from 'react'
import { BYOK_PROVIDERS, byokHeaders, getByokConfig, setByokConfig, type ByokConfig } from '@/lib/byok'

export interface UseByok {
  providerId: string
  setProviderId: (id: string) => void
  keyInput: string
  setKeyInput: (value: string) => void
  baseUrl: string
  setBaseUrl: (value: string) => void
  model: string
  setModel: (value: string) => void
  authStyle: 'api-key' | 'bearer'
  setAuthStyle: (value: 'api-key' | 'bearer') => void
  hasKey: boolean
  isCustom: boolean
  saveKey: () => void
  clearKey: () => void
  testState: 'idle' | 'testing' | 'ok' | 'fail'
  testMessage: string
  testKey: () => Promise<void>
}

export function useByok(): UseByok {
  const existing = getByokConfig()
  const [providerId, setProviderIdState] = useState(existing?.providerId ?? 'mimo-token-plan')
  const [keyInput, setKeyInput] = useState('')
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? BYOK_PROVIDERS[0].baseUrl)
  const [model, setModel] = useState(existing?.model ?? BYOK_PROVIDERS[0].defaultModel)
  const [authStyle, setAuthStyle] = useState<'api-key' | 'bearer'>(existing?.authStyle ?? BYOK_PROVIDERS[0].authStyle)
  const [hasKey, setHasKey] = useState(() => !!getByokConfig()?.key)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const preset = BYOK_PROVIDERS.find((p) => p.id === providerId) ?? BYOK_PROVIDERS[0]
  const isCustom = !!preset.custom

  const setProviderId = useCallback((id: string) => {
    setProviderIdState(id)
    const p = BYOK_PROVIDERS.find((x) => x.id === id)
    if (p) {
      setBaseUrl(p.baseUrl)
      setModel(p.defaultModel)
      setAuthStyle(p.authStyle)
    }
    setTestState('idle')
    setTestMessage('')
  }, [])

  const saveKey = useCallback(() => {
    const key = keyInput.trim()
    if (!key) return
    const config: ByokConfig = { providerId, key, baseUrl: baseUrl.trim(), model: model.trim(), authStyle }
    setByokConfig(config)
    setHasKey(true)
    setKeyInput('')
    setTestState('idle')
    setTestMessage('')
  }, [keyInput, providerId, baseUrl, model, authStyle])

  const clearKey = useCallback(() => {
    setByokConfig(null)
    setHasKey(false)
    setKeyInput('')
    setTestState('idle')
    setTestMessage('')
  }, [])

  const testKey = useCallback(async () => {
    // Test what is in the form if a key was typed, else the saved config.
    const headers = keyInput.trim()
      ? { 'x-byok-key': keyInput.trim(), 'x-byok-base-url': baseUrl.trim(), 'x-byok-model': model.trim(), 'x-byok-auth': authStyle }
      : byokHeaders()
    if (!headers['x-byok-key']) {
      setTestState('fail')
      setTestMessage('Enter a key first.')
      return
    }
    setTestState('testing')
    setTestMessage('')
    try {
      const r = await fetch('/api/byok-check', { headers })
      const d = await r.json()
      if (d.ok) {
        setTestState('ok')
        setTestMessage(`Key works (${d.model}).`)
      } else {
        setTestState('fail')
        setTestMessage(d.error || 'Provider rejected the key.')
      }
    } catch {
      setTestState('fail')
      setTestMessage('Could not reach the check endpoint.')
    }
  }, [keyInput, baseUrl, model, authStyle])

  return {
    providerId, setProviderId,
    keyInput, setKeyInput,
    baseUrl, setBaseUrl,
    model, setModel,
    authStyle, setAuthStyle,
    hasKey, isCustom,
    saveKey, clearKey,
    testState, testMessage, testKey,
  }
}
