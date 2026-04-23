import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ results: [] }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ results: [] }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ results: [] })

  const [projects, docs, tasks] = await Promise.all([
    db.project.findMany({
      where: {
        workspaceId: user.workspaceId,
        archived: false,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, slug: true, icon: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
    db.doc.findMany({
      where: {
        workspaceId: user.workspaceId,
        title: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, title: true, slug: true },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    db.task.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' },
        project: {
          workspaceId: user.workspaceId,
          archived: false,
        },
      },
      select: {
        id: true,
        title: true,
        project: { select: { slug: true, name: true } },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const results = [
    ...projects.map((p) => ({
      id: p.id,
      type: 'project' as const,
      title: p.name,
      meta: null,
      href: `/projects/${p.slug}`,
      icon: p.icon,
    })),
    ...docs.map((d) => ({
      id: d.id,
      type: 'doc' as const,
      title: d.title,
      meta: null,
      href: `/docs/${d.slug}`,
      icon: null,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      meta: t.project.name,
      href: `/projects/${t.project.slug}`,
      icon: null,
    })),
  ]

  return NextResponse.json({ results })
}
