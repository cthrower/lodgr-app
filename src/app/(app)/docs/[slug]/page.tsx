import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import DocEditor from '@/components/docs/doc-editor'

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  const doc = await db.doc.findFirst({
    where: { slug, workspaceId: user.workspaceId },
    include: {
      children: { orderBy: { position: 'asc' }, select: { id: true, title: true, slug: true } },
      project: { select: { name: true, slug: true } },
    },
  })

  if (!doc) notFound()

  return (
    <DocEditor
      doc={{
        id: doc.id,
        title: doc.title,
        body: doc.body,
        slug: doc.slug,
        projectId: doc.projectId,
        projectSlug: doc.project?.slug ?? null,
        projectName: doc.project?.name ?? null,
        parentId: doc.parentId,
        children: doc.children,
      }}
    />
  )
}
