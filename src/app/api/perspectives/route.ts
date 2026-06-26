// Perspective tags — list all
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const perspectives = await db.perspectiveTag.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ perspectives })
}
