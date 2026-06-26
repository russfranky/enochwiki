// User notes — CRUD
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (ref) {
    const notes = await db.note.findMany({
      where: { scriptureRef: ref },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ref, notes })
  }
  const notes = await db.note.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, content, scriptureRef, themeSlug, tags } = body as {
    title: string
    content: string
    scriptureRef?: string
    themeSlug?: string
    tags?: string
  }
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 })
  }
  const note = await db.note.create({
    data: { title, content, scriptureRef, themeSlug, tags },
  })
  return NextResponse.json({ note })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, title, content, tags } = body as {
    id: string
    title?: string
    content?: string
    tags?: string
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const note = await db.note.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(content ? { content } : {}),
      ...(tags !== undefined ? { tags } : {}),
    },
  })
  return NextResponse.json({ note })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.note.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
