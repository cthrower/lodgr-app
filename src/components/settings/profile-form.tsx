'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions/users'
import { useToast } from '@/components/ui/toast'

type Props = {
  name: string
  email: string
}

export default function ProfileForm({ name, email }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [currentName, setCurrentName] = useState(name)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateProfile(formData)
      success(result.message)
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to save profile changes')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
          Name
        </label>
        <input
          name="name"
          value={currentName}
          onChange={(e) => setCurrentName(e.target.value)}
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
          value={email}
          disabled
          className="w-full rounded-lg border px-3 py-2 text-sm opacity-60 cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
