// Cross-references — fetch all or filter by source ref
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  if (ref) {
    const outgoing = await db.crossReference.findMany({
      where: { sourceRef: ref },
      orderBy: { confidence: 'desc' },
    })
    const incoming = await db.crossReference.findMany({
      where: { targetRef: ref },
      orderBy: { confidence: 'desc' },
    })
    return NextResponse.json({ ref, outgoing, incoming })
  }

  const all = await db.crossReference.findMany({
    orderBy: { confidence: 'desc' },
  })
  return NextResponse.json({ crossReferences: all })
}
