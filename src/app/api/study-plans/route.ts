// Study plans — list and view
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const plan = await db.studyPlan.findUnique({
      where: { slug },
      include: { items: { orderBy: { day: 'asc' } } },
    })
    if (!plan) return NextResponse.json({ error: 'Study plan not found' }, { status: 404 })
    return NextResponse.json({ plan })
  }

  const plans = await db.studyPlan.findMany({
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json({ plans })
}
