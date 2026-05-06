'use client'

import { useState } from 'react'
import { changePassword } from '@/actions/users'
import { useToast } from '@/components/ui/toast'

export function ChangePasswordForm() {
  const { success: toastSuccess, error: toastError } = useToast()
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await changePassword(formData)
      toastSuccess(result.message)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]">
      <h2 className="text-sm font-semibold mb-4 text-[var(--text-primary)]">Change password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
            Current password
          </label>
          <input
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
            New password
          </label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
            Confirm new password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] disabled:opacity-50"
        >
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
