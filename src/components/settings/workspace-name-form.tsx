'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWorkspaceName } from '@/actions/users'
import { useToast } from '@/components/ui/toast'

type Props = {
  initialName: string
}

export default function WorkspaceNameForm({ initialName }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [name, setName] = useState(initialName)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateWorkspaceName(formData)
      success(result.message)
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update workspace name')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
          Name
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save workspace'}
      </button>
    </form>
  )
}
