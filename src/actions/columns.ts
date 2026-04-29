'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createColumn({
  projectId,
  name,
}: {
  projectId: string
  name: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const last = await db.column.findFirst({
    where: { projectId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const col = await db.column.create({
    data: { projectId, name: name.trim(), position: (last?.position ?? 0) + 1 },
  })

  revalidatePath('/projects')
  return col
}

export async function updateColumn({ id, name }: { id: string; name: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.column.update({ where: { id }, data: { name: name.trim() } })
  revalidatePath('/projects')
}

export async function deleteColumn(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const col = await db.column.findUnique({ where: { id }, select: { projectId: true } })
  if (!col) return

  const other = await db.column.findFirst({
    where: { projectId: col.projectId, id: { not: id } },
    orderBy: { position: 'asc' },
  })

  if (other) {
    await db.task.updateMany({ where: { columnId: id }, data: { columnId: other.id } })
  }

  await db.column.delete({ where: { id } })
  revalidatePath('/projects')
}

export async function reorderColumns(updates: { id: string; position: number }[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await Promise.all(
    updates.map(({ id, position }) =>
      db.column.update({ where: { id }, data: { position } })
    )
  )
}
