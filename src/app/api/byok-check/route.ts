// BYOK key check — probes the visitor-supplied provider's /models
// endpoint with the visitor's own key (headers only, nothing stored).
// Used by the "Test connection" button in the BYOK settings.
import { NextRequest, NextResponse } from 'next/server'
import { byokFromHeaders, checkAiHealth } from '@/lib/ai-provider'
import { aiRpm, checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { rpm: aiRpm(), bucket: 'ai' })
  if (limited) return limited

  const override = byokFromHeaders(req)
  if (!override) {
    return NextResponse.json({ ok: false, error: 'No valid key configuration supplied.' }, { status: 400 })
  }
  const health = await checkAiHealth(override)
  return NextResponse.json(health, { status: health.ok ? 200 : 502 })
}
