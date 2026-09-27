// Admin gate for mutating editorial API routes.
// Every write path (review transitions, publish, note edits) must call
// requireAdmin() first. Public read paths (GET) stay open.
// If ADMIN_TOKEN is not set, all mutations are disabled (fail closed).
// A request is allowed only when it carries the exact token as a Bearer token.
import { NextRequest, NextResponse } from 'next/server'

export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    // No token configured. Refuse all mutations rather than allow them.
    return NextResponse.json({ error: 'Mutations disabled' }, { status: 503 })
  }
  const header = req.headers.get('authorization')
  if (header !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Token matches. Allow the request.
  return null
}
