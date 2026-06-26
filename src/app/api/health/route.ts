// Z.ai API health check — reports auth status, balance, and model availability
import { NextResponse } from 'next/server'
import { checkApiHealth } from '@/lib/zai-api'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET() {
  const health = await checkApiHealth()
  return NextResponse.json({
    ...health,
    timestamp: new Date().toISOString(),
    baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
  })
}
