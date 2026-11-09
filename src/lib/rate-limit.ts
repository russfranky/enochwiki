// In-memory per-IP token bucket rate limiter.
// Single-process guard: enough for one-box deploys. Counts reset with the process.
import { NextRequest, NextResponse } from 'next/server'

interface Bucket {
  tokens: number
  updatedAt: number
}

const buckets = new Map<string, Bucket>()

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

function envRpm(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < 0) return fallback
  return n
}

export function aiRpm(): number {
  return envRpm('RATE_LIMIT_AI_RPM', 20)
}

export function readRpm(): number {
  return envRpm('RATE_LIMIT_READ_RPM', 120)
}

export interface RateLimitOptions {
  rpm: number
  bucket?: string
}

/**
 * Check the per-IP token bucket. Returns null when the request may proceed,
 * otherwise a 429 JSON response with a Retry-After header.
 */
export function checkRateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const rpm = opts.rpm
  if (!rpm || rpm <= 0) return null
  const key = `${opts.bucket || 'default'}:${clientIp(req)}`
  const now = Date.now()

  let b = buckets.get(key)
  if (!b) {
    b = { tokens: rpm, updatedAt: now }
    buckets.set(key, b)
  }
  const elapsedMin = (now - b.updatedAt) / 60000
  b.tokens = Math.min(rpm, b.tokens + elapsedMin * rpm)
  b.updatedAt = now

  if (b.tokens < 1) {
    const retryAfter = Math.max(1, Math.ceil(((1 - b.tokens) / rpm) * 60))
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }
  b.tokens -= 1

  // Keep the map small: drop buckets idle for over an hour.
  if (buckets.size > 20000) {
    for (const [k, v] of buckets) {
      if (now - v.updatedAt > 3600000) buckets.delete(k)
    }
  }
  return null
}
