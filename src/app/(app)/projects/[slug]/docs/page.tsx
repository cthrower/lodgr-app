import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import ProjectHeader from '@/components/project-header'
import { createDoc } from '@/actions/docs'
import { format } from 'date-fns'

export default async function ProjectDocsPage({
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
  })

  if (!project) notFound()

  const docs = await db.doc.findMany({
    where: { projectId: project.id, parentId: null },
    orderBy: { updatedAt: 'desc' },
  })

  async function handleCreate() {
    'use server'
    await createDoc({ title: 'Untitled', projectId: project!.id })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ProjectHeader
        project={{ id: project.id, name: project.name, slug: project.slug, colour: project.colour, icon: project.icon }}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-[var(--text-primary)]">Docs</h2>
          <form action={handleCreate}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              New doc
            </button>
          </form>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No docs yet for this project.</p>
        ) : (
          <div className="space-y-0.5">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.slug}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-[var(--text-secondary)]"
              >
                <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span className="flex-1 text-sm text-[var(--text-primary)]">
                  {doc.title}
                </span>
                <span className="text-xs shrink-0 text-[var(--text-muted)]">
                  {format(doc.updatedAt, 'MMM d')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
