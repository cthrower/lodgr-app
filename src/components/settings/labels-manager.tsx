'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createLabel, deleteLabel } from '@/actions/labels'
import { bgClassForColor } from '@/lib/color-classes'
import { cn } from '@/lib/utils'

type Label = { id: string; name: string; colour: string }

const PRESET_COLOURS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export default function LabelsManager({ initial }: { initial: Label[] }) {
  const [labels, setLabels] = useState<Label[]>(initial)
  const [name, setName] = useState('')
  const [colour, setColour] = useState(PRESET_COLOURS[0])
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const label = await createLabel({ name: name.trim(), colour })
      setLabels((prev) => [...prev, label])
      setName('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this label? It will be removed from all tasks.')) return
    await deleteLabel(id)
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Existing labels */}
      <div className="flex flex-wrap gap-2">
        {labels.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">
            No labels yet.
          </p>
        )}
        {labels.map((label) => (
          <div
            key={label.id}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-white text-sm font-medium',
              bgClassForColor(label.colour)
            )}
          >
            <span>{label.name}</span>
            <button
              onClick={() => handleDelete(label.id)}
              className="opacity-70 hover:opacity-100 transition-opacity"
              title="Delete label"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex items-center gap-2 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          className="rounded-md border px-3 py-1.5 text-sm focus:outline-none border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
        />
        <div className="flex gap-1.5">
          {PRESET_COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColour(c)}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-all',
                bgClassForColor(c),
                colour === c ? 'border-[var(--text-primary)]' : 'border-transparent'
              )}
              title={c}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 bg-[var(--primary)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add label
        </button>
      </form>
    </div>
  )
}
