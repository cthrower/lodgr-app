import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { updateProfile } from '@/actions/users'
import { ChangePasswordForm } from '@/components/settings/change-password-form'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">
        Profile
      </h1>

      <div
        className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]"
      >
        <form action={updateProfile} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
              Name
            </label>
            <input
              name="name"
              defaultValue={user.name}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm opacity-60 cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)]"
          >
            Save changes
          </button>
        </form>
      </div>

      <ChangePasswordForm />
    </div>
  )
}
