// Glossary — list and view
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const term = searchParams.get('term')

  if (term) {
    const entry = await db.glossaryEntry.findUnique({ where: { term } })
    if (!entry) return NextResponse.json({ error: 'Term not found' }, { status: 404 })
    return NextResponse.json({ entry })
  }

  const entries = await db.glossaryEntry.findMany({
    orderBy: { term: 'asc' },
  })
  return NextResponse.json({ entries })
}
