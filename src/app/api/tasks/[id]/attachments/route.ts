import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const { id } = await params
  const attachments = await db.attachment.findMany({
    where: { taskId: id },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(attachments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: taskId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), 'uploads', taskId)
  await mkdir(uploadDir, { recursive: true })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}-${safeName}`
  const storagePath = join('uploads', taskId, filename)

  await writeFile(join(process.cwd(), storagePath), buffer)

  const attachment = await db.attachment.create({
    data: {
      taskId,
      uploadedById: user.id,
      filename: file.name,
      storagePath,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    },
    include: { uploadedBy: { select: { name: true } } },
  })

  return NextResponse.json(attachment)
}
