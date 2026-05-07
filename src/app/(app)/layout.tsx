import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import CommandPalette from '@/components/command-palette'
import { ToastProvider } from '@/components/ui/toast'

type WorkspaceProject = {
  id: string
  name: string
  slug: string
  colour: string
  icon: string
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      workspace: {
        include: {
          projects: {
            where: {
              archived: false,
              OR: [{ isPrivate: false }, { createdById: session.user.id }],
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <ToastProvider>
        <Sidebar
          user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
          workspace={{ name: user.workspace.name, slug: user.workspace.slug }}
          projects={user.workspace.projects.map((p: WorkspaceProject) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            colour: p.colour,
            icon: p.icon,
          }))}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <CommandPalette />
      </ToastProvider>
    </div>
  )
}
