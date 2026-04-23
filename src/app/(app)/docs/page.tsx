import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { createDoc } from '@/actions/docs'
import { format } from 'date-fns'

async function handleCreate() {
  'use server'
  await createDoc({ title: 'Untitled' })
}

export default async function DocsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const docs = await db.doc.findMany({
    where: { workspaceId: user.workspaceId, parentId: null, projectId: null },
    orderBy: { updatedAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Docs
        </h1>
        <form action={handleCreate}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white bg-[var(--primary)]"
          >
            <Plus className="h-4 w-4" />
            New doc
          </button>
        </form>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm mb-4 text-[var(--text-muted)]">
            No docs yet. Create one to get started.
          </p>
          <form action={handleCreate}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)]"
            >
              <Plus className="h-4 w-4" />
              New doc
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-1">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/docs/${doc.slug}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group text-[var(--text-secondary)]"
            >
              <FileText
                className="h-4 w-4 shrink-0 transition-colors text-[var(--text-muted)]"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--text-primary)]">
                  {doc.title}
                </span>
              </div>
              <span className="text-xs shrink-0 text-[var(--text-muted)]">
                {format(doc.updatedAt, 'MMM d')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
