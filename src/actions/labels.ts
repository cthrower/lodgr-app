'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createLabel({ name, colour }: { name: string; colour: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('User not found')

  const label = await db.taskLabel.create({
    data: { workspaceId: user.workspaceId, name: name.trim(), colour },
  })

  revalidatePath('/settings')
  return label
}

export async function deleteLabel(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.taskLabel.delete({ where: { id } })
  revalidatePath('/settings')
  revalidatePath('/projects')
}

export async function toggleLabelOnTask({
  taskId,
  labelId,
  active,
}: {
  taskId: string
  labelId: string
  active: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (active) {
    await db.taskLabelAssignment.upsert({
      where: { taskId_labelId: { taskId, labelId } },
      update: {},
      create: { taskId, labelId },
    })
  } else {
    await db.taskLabelAssignment.deleteMany({
      where: { taskId, labelId },
    })
  }

  revalidatePath('/projects')
}
