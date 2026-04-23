import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const attachment = await db.attachment.findUnique({ where: { id } })
  if (!attachment) return new NextResponse('Not found', { status: 404 })

  const filePath = join(process.cwd(), attachment.storagePath)
  if (!existsSync(filePath)) return new NextResponse('File not found', { status: 404 })

  const data = await readFile(filePath)
  return new NextResponse(data, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': String(data.length),
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const attachment = await db.attachment.findUnique({ where: { id } })
  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filePath = join(process.cwd(), attachment.storagePath)
  try {
    await unlink(filePath)
  } catch {
    // file may already be gone
  }

  await db.attachment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
