import { createProject } from '@/actions/projects'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { bgClassForColor } from '@/lib/color-classes'
import { cn } from '@/lib/utils'

const PRESET_COLOURS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
]

const PRESET_ICONS = ['📁', '🚀', '⚡', '🎯', '🔨', '💡', '🌟', '🎨', '📊', '🔬']

export default function NewProjectPage() {
  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm transition-colors text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <span className="text-[var(--text-muted)]">/</span>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          New project
        </h1>
      </div>

      <div
        className="rounded-xl border p-6 border-[var(--border)] bg-[var(--surface)]"
      >
        <form action={createProject} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              autoFocus
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
              placeholder="My Project"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]"
            >
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
              placeholder="What is this project about?"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
            >
              Colour
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLOURS.map((colour, i) => (
                <label key={colour} className="cursor-pointer">
                  <input
                    type="radio"
                    name="colour"
                    value={colour}
                    className="sr-only"
                    defaultChecked={i === 0}
                  />
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full border-2 border-transparent hover:scale-110 transition-transform',
                      bgClassForColor(colour)
                    )}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
            >
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((icon, i) => (
                <label key={icon} className="cursor-pointer">
                  <input
                    type="radio"
                    name="icon"
                    value={icon}
                    className="sr-only"
                    defaultChecked={i === 0}
                  />
                  <div
                    className="h-9 w-9 rounded-lg border flex items-center justify-center text-lg hover:scale-105 transition-transform border-[var(--border)]"
                  >
                    {icon}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors bg-[var(--primary)]"
            >
              Create project
            </button>
            <Link
              href="/projects"
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-center transition-colors border-[var(--border)] text-[var(--text-secondary)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
