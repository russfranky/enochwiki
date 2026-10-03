// Health check — feature-aware: AI disabled for launch is healthy, not an error
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkApiHealth } from '@/lib/zai-api'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  const aiEnabled = !!process.env.NEXT_PUBLIC_AI_ENABLED
  const scrapeEnabled = !!process.env.SCRAPE_ENABLED

  // AI is intentionally disabled for launch; missing key is not unhealthy
  const ai = aiEnabled ? await checkApiHealth() : { ok: true, enabled: false, note: 'AI disabled for launch' }

  // D-029: `ok` reflects the components instead of a hardcoded true. A
  // failed AI health check (when AI is enabled) or an unreachable database
  // flips the overall status so monitors see the real state.
  let dbOk = true
  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    dbOk = false
  }

  return NextResponse.json({
    ok: ai.ok && dbOk,
    timestamp: new Date().toISOString(),
    ai,
    db: { ok: dbOk },
    scrape: { enabled: scrapeEnabled },
    baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
  })
}
