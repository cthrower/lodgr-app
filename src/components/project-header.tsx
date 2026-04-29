'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, List, FileText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Project = {
  id: string
  name: string
  slug: string
  colour: string
  icon: string
}

type Props = {
  project: Project
  onAddTask?: () => void
}

export default function ProjectHeader({ project, onAddTask }: Props) {
  const pathname = usePathname()
  const isBoard = pathname === `/projects/${project.slug}`
  const isList = pathname === `/projects/${project.slug}/list`
  const isDocs = pathname.startsWith(`/projects/${project.slug}/docs`)

  return (
    <div className="flex items-center gap-4 px-5 py-2.5 border-b shrink-0 border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="text-xl shrink-0 leading-none">{project.icon}</span>
        <h1 className="font-semibold truncate text-[var(--text-primary)]">
          {project.name}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-0.5 gap-0.5">
          <Link
            href={`/projects/${project.slug}`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150',
              isBoard
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </Link>
          <Link
            href={`/projects/${project.slug}/list`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150',
              isList
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Link>
          <Link
            href={`/projects/${project.slug}/docs`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150',
              isDocs
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Docs
          </Link>
        </div>

        {onAddTask && (
          <button
            onClick={onAddTask}
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
