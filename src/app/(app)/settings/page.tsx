import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User } from 'lucide-react'
import LabelsManager from '@/components/settings/labels-manager'
import InviteForm from '@/components/settings/invite-form'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      workspace: {
        include: {
          users: { where: { active: true }, orderBy: { createdAt: 'asc' } },
          taskLabels: { orderBy: { name: 'asc' } },
        },
      },
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Workspace */}
        <section
          className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]"
        >
          <h2 className="text-base font-medium mb-4 text-[var(--text-primary)]">
            Workspace
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
              Name
            </label>
            <p className="text-sm text-[var(--text-primary)]">
              {user.workspace.name}
            </p>
          </div>
        </section>

        {/* Members */}
        <section
          className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]"
        >
          <h2 className="text-base font-medium mb-4 text-[var(--text-primary)]">
            Members
          </h2>
          <ul className="space-y-3 mb-4">
            {user.workspace.users.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-[var(--primary)]"
                >
                  {member.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {member.name}
                    {member.id === user.id && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {member.email} · {member.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {user.role === 'owner' && (
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-sm font-medium mb-2 text-[var(--text-primary)]">
                Invite a member
              </p>
              <InviteForm />
            </div>
          )}
        </section>

        {/* Labels */}
        <section
          className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]"
        >
          <h2 className="text-base font-medium mb-4 text-[var(--text-primary)]">
            Labels
          </h2>
          <LabelsManager
            initial={user.workspace.taskLabels.map((l) => ({
              id: l.id,
              name: l.name,
              colour: l.colour,
            }))}
          />
        </section>

        {/* Profile link */}
        <Link
          href="/settings/profile"
          className="flex items-center gap-3 rounded-xl border p-4 transition-colors border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
        >
          <User className="h-5 w-5 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Profile settings
          </span>
        </Link>
      </div>
    </div>
  )
}
