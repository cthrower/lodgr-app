import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArchiveRestore } from 'lucide-react'
import { restoreProject } from '@/actions/projects'
import { bgTintClassForColor } from '@/lib/color-classes'
import { cn } from '@/lib/utils'

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const [projects, archivedProjects] = await Promise.all([
    db.project.findMany({
      where: { workspaceId: user.workspaceId, archived: false },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),
    db.project.findMany({
      where: { workspaceId: user.workspaceId, archived: true },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Projects
        </h1>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors bg-[var(--primary)]"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm mb-4 text-[var(--text-muted)]">
            No projects yet. Create your first one to get started.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)]"
          >
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group block rounded-xl border p-5 transition-colors border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0', bgTintClassForColor(project.colour))}
                >
                  {project.icon}
                </div>
                <div className="min-w-0">
                  <h3
                    className="font-medium truncate transition-colors text-[var(--text-primary)]"
                  >
                    {project.name}
                  </h3>
                  {project.description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2 text-[var(--text-muted)]"
                    >
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
              </p>
            </Link>
          ))}
        </div>
      )}

      {archivedProjects.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-medium mb-4 text-[var(--text-muted)]">
            Archived
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border p-5 opacity-60 border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0', bgTintClassForColor(project.colour))}
                  >
                    {project.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate text-[var(--text-primary)]">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs mt-0.5 line-clamp-1 text-[var(--text-muted)]">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--text-muted)]">
                    {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
                  </p>
                  <form action={restoreProject.bind(null, project.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs font-medium transition-colors text-[var(--primary)]"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
