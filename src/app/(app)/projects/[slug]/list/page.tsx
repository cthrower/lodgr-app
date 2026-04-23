import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import ProjectHeader from '@/components/project-header'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { bgClassForColor } from '@/lib/color-classes'

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: 'text-[#ef4444]',
  high: 'text-[#f97316]',
  medium: 'text-[#eab308]',
  low: 'text-[#3b82f6]',
  none: 'text-[var(--text-muted)]',
}

export default async function ProjectListPage({
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
  })

  if (!project) notFound()

  const now = new Date()
  const allTasks = project.columns.flatMap((col) =>
    col.tasks.map((task) => ({
      ...task,
      columnName: col.name,
      isOverdue: task.dueDate != null && task.dueDate < now,
    }))
  )

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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border overflow-hidden border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--sidebar-bg)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Task
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Priority
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Assignee
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Labels
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">
                  Due date
                </th>
              </tr>
            </thead>
            <tbody>
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                    No tasks yet. Add one from the board view.
                  </td>
                </tr>
              ) : (
                allTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t transition-colors border-[var(--border)]"
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {task.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                        {task.columnName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium capitalize', PRIORITY_COLOURS[task.priority] ?? 'text-[var(--text-muted)]')}>
                        {task.priority === 'none' ? '—' : task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-[var(--primary)]"
                          >
                            {task.assignee.name[0].toUpperCase()}
                          </div>
                          <span className="text-[var(--text-secondary)]">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {task.labels.map(({ label }) => (
                          <span
                            key={label.id}
                            className={cn('text-xs px-1.5 py-0.5 rounded-full text-white font-medium', bgClassForColor(label.colour))}
                          >
                            {label.name}
                          </span>
                        ))}
                        {task.labels.length === 0 && (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span
                          className={cn('text-xs font-medium', task.isOverdue ? 'text-[#ef4444]' : 'text-[var(--text-secondary)]')}
                          title={task.isOverdue ? 'Overdue' : undefined}
                        >
                          {task.isOverdue && '⚠ '}
                          {format(task.dueDate, 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
