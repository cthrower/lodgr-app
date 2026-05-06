'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject, updateProject } from '@/actions/projects'
import { useToast } from '@/components/ui/toast'

type Props = {
  project: {
    id: string
    name: string
    description: string | null
    isPrivate: boolean
  }
}

export default function ProjectSettingsForm({ project }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [isPrivate, setIsPrivate] = useState(project.isPrivate)
  const [pending, setPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    try {
      await updateProject(project.id, {
        name,
        description,
        isPrivate,
      })
      success('Project updated successfully.')
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update project')
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    const confirmed = confirm('Delete this project? This cannot be undone and will remove all tasks, docs, and columns.')
    if (!confirmed) return

    setDeletePending(true)

    try {
      await deleteProject(project.id)
      router.push('/projects')
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete project')
      setDeletePending(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="rounded-xl border p-6 space-y-4 border-[var(--border)] bg-[var(--surface)]">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Project details</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg border p-3 border-[var(--border)] bg-[var(--background)]">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Private project: only you can see this project and its tasks/docs.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="rounded-xl border p-6 border-red-300/50 bg-red-50/40 dark:bg-red-950/10">
        <h2 className="text-base font-semibold text-red-600 mb-2">Danger zone</h2>
        <p className="text-sm text-red-600/90 mb-4">
          Deleting a project is permanent and cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
        >
          {deletePending ? 'Deleting…' : 'Delete project'}
        </button>
      </section>
    </div>
  )
}
