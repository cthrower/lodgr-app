'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('User not found')

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const colour = (formData.get('colour') as string) || '#6366f1'
  const icon = (formData.get('icon') as string) || '📁'

  if (!name?.trim()) throw new Error('Name is required')

  const slug = generateSlug(name)

  const project = await db.project.create({
    data: {
      workspaceId: user.workspaceId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      colour,
      icon,
      createdById: user.id,
    },
  })

  await db.column.createMany({
    data: [
      { projectId: project.id, name: 'Backlog', position: 0 },
      { projectId: project.id, name: 'In Progress', position: 1 },
      { projectId: project.id, name: 'In Review', position: 2 },
      { projectId: project.id, name: 'Done', position: 3 },
    ],
  })

  revalidatePath('/projects')
  redirect(`/projects/${slug}`)
}

export async function archiveProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.project.update({
    where: { id: projectId },
    data: { archived: true },
  })

  revalidatePath('/projects')
  redirect('/projects')
}

export async function restoreProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.project.update({
    where: { id: projectId },
    data: { archived: false },
  })

  revalidatePath('/projects')
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; colour?: string; icon?: string }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const project = await db.project.update({
    where: { id: projectId },
    data,
  })

  revalidatePath(`/projects/${project.slug}`)
  revalidatePath('/projects')
  return project
}
