import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import ProfileForm from '@/components/settings/profile-form'

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
        <ProfileForm name={user.name} email={user.email} />
      </div>

      <ChangePasswordForm />
    </div>
  )
}
