import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], unreadCount: 0 }, { status: 401 })
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
  ])

  const enriched = await Promise.all(
    notifications.map(async (n) => {
      let entityTitle = ''
      if (n.entityType === 'task') {
        const task = await db.task.findUnique({
          where: { id: n.entityId },
          select: { title: true },
        })
        entityTitle = task?.title ?? ''
      } else if (n.entityType === 'comment') {
        const comment = await db.taskComment.findUnique({
          where: { id: n.entityId },
          include: { task: { select: { title: true } } },
        })
        entityTitle = comment?.task.title ?? ''
      }
      return { ...n, entityTitle }
    })
  )

  return NextResponse.json({ items: enriched, unreadCount })
}
