import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import ProjectHeader from '@/components/project-header'
import ProjectSettingsForm from '@/components/project/project-settings-form'

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const project = await db.project.findFirst({
    where: {
      slug,
      workspaceId: user.workspaceId,
      OR: [{ isPrivate: false }, { createdById: user.id }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      colour: true,
      icon: true,
      description: true,
      isPrivate: true,
      createdById: true,
    },
  })

  if (!project) notFound()
  if (project.createdById !== user.id) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ProjectHeader
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          colour: project.colour,
          icon: project.icon,
        }}
      />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <ProjectSettingsForm
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            isPrivate: project.isPrivate,
          }}
        />
      </div>
    </div>
  )
}
