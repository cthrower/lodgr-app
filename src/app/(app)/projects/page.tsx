import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArchiveRestore, FolderKanban } from 'lucide-react'
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
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm mt-0.5 text-[var(--text-muted)]">
            {projects.length} active {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Link
          href="/projects/new"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed border-[var(--border)]">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ background: 'var(--gradient-subtle)' }}
          >
            <FolderKanban className="h-7 w-7 text-[var(--primary)]" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
            No projects yet
          </p>
          <p className="text-sm mb-6 text-[var(--text-muted)]">
            Create your first project to get started
          </p>
          <Link
            href="/projects/new"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
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
              className="group block rounded-2xl border p-5 transition-all duration-200 border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200 group-hover:scale-110',
                    bgTintClassForColor(project.colour)
                  )}
                >
                  {project.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate transition-colors text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs mt-0.5 line-clamp-2 text-[var(--text-muted)]">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--surface-hover)] text-[var(--text-muted)]">
                  {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {archivedProjects.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Archived
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border p-5 opacity-50 border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0', bgTintClassForColor(project.colour))}
                  >
                    {project.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate text-[var(--text-primary)]">
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
                  <span className="text-xs text-[var(--text-muted)]">
                    {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
                  </span>
                  <form action={restoreProject.bind(null, project.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs font-semibold transition-colors text-[var(--primary)] hover:opacity-80"
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
