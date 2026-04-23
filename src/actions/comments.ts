'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sendCommentEmail } from '@/lib/email'

export async function createComment({
  taskId,
  body,
}: {
  taskId: string
  body: unknown
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('User not found')

  const comment = await db.taskComment.create({
    data: { taskId, authorId: user.id, body: body as object },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  })

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { email: true, name: true } },
      project: { select: { slug: true } },
    },
  })

  if (task?.assigneeId && task.assigneeId !== user.id) {
    await db.notification.create({
      data: {
        userId: task.assigneeId,
        type: 'commented',
        entityType: 'comment',
        entityId: comment.id,
      },
    })

    try {
      const commentText =
        typeof (body as Record<string, unknown>)?.text === 'string'
          ? ((body as Record<string, unknown>).text as string)
          : ''

      if (task.assignee) {
        await sendCommentEmail({
          to: task.assignee.email,
          toName: task.assignee.name,
          taskTitle: task.title,
          commenterName: user.name,
          commentText,
          projectSlug: task.project.slug,
        })
      }
    } catch {
      // email failure must not break the action
    }
  }

  return comment
}

export async function deleteComment(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.taskComment.delete({ where: { id } })
}
