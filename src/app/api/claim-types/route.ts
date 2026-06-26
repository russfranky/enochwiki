// Claim types — list all
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const claimTypes = await db.claimType.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ claimTypes })
}
