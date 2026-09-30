// Health check — feature-aware: AI disabled for launch is healthy, not an error
import { NextResponse } from 'next/server'
import { checkApiHealth } from '@/lib/zai-api'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  const aiEnabled = !!process.env.NEXT_PUBLIC_AI_ENABLED
  const scrapeEnabled = !!process.env.SCRAPE_ENABLED

  // AI is intentionally disabled for launch; missing key is not unhealthy
  const ai = aiEnabled ? await checkApiHealth() : { ok: true, enabled: false, note: 'AI disabled for launch' }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ai,
    scrape: { enabled: scrapeEnabled },
    baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
  })
}
