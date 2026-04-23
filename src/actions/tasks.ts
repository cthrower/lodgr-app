'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sendTaskAssignedEmail } from '@/lib/email'

export async function createTask({
  projectId,
  columnId,
  title,
}: {
  projectId: string
  columnId: string
  title: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('User not found')

  const lastTask = await db.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const task = await db.task.create({
    data: {
      projectId,
      columnId,
      title: title.trim(),
      position: (lastTask?.position ?? 0) + 1000,
      createdById: user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      labels: { include: { label: true } },
    },
  })

  revalidatePath('/projects')
  return task
}

export async function moveTask({
  taskId,
  columnId,
  position,
}: {
  taskId: string
  columnId: string
  position: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.task.update({
    where: { id: taskId },
    data: { columnId, position },
  })
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string
    description?: unknown
    priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent'
    assigneeId?: string | null
    columnId?: string
    dueDate?: Date | null
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const prev = await db.task.findUnique({ where: { id: taskId }, select: { assigneeId: true } })

  const task = await db.task.update({
    where: { id: taskId },
    data: data as Parameters<typeof db.task.update>[0]['data'],
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      labels: { include: { label: true } },
      column: { select: { name: true } },
    },
  })

  if (
    data.assigneeId &&
    data.assigneeId !== prev?.assigneeId &&
    data.assigneeId !== session.user.id
  ) {
    await db.notification.create({
      data: {
        userId: data.assigneeId,
        type: 'assigned',
        entityType: 'task',
        entityId: taskId,
      },
    })

    try {
      const [assignee, assigner, taskWithProject] = await Promise.all([
        db.user.findUnique({
          where: { id: data.assigneeId },
          select: { email: true, name: true },
        }),
        db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        }),
        db.task.findUnique({
          where: { id: taskId },
          include: { project: { select: { slug: true } } },
        }),
      ])

      if (assignee && assigner && taskWithProject) {
        await sendTaskAssignedEmail({
          to: assignee.email,
          toName: assignee.name,
          taskTitle: taskWithProject.title,
          assignerName: assigner.name,
          projectSlug: taskWithProject.project.slug,
        })
      }
    } catch {
      // email failure must not break the action
    }
  }

  revalidatePath('/projects')
  return task
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.task.delete({ where: { id: taskId } })
  revalidatePath('/projects')
}
