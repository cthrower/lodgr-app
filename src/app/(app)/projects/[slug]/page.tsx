import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import ProjectHeader from '@/components/project-header'
import KanbanBoard from '@/components/kanban/board'

export default async function ProjectKanbanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const [project, members, labels] = await Promise.all([
    db.project.findFirst({
      where: { slug, workspaceId: user.workspaceId, archived: false },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels: { include: { label: true } },
              },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: { workspaceId: user.workspaceId, active: true },
      select: { id: true, name: true, avatarUrl: true },
    }),
    db.taskLabel.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, colour: true },
    }),
  ])

  if (!project) notFound()

  const boardProject = {
    id: project.id,
    slug: project.slug,
    columns: project.columns.map((col) => ({
      id: col.id,
      name: col.name,
      position: col.position,
      colour: col.colour,
      tasks: col.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        columnId: task.columnId,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        labels: task.labels.map((l) => ({ label: l.label })),
        dueDate: task.dueDate?.toISOString() ?? null,
      })),
    })),
  }

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
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <KanbanBoard project={boardProject} members={members} labels={labels} />
      </div>
    </div>
  )
}
