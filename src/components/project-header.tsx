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
    <div
      className="flex items-center gap-4 px-6 py-3 border-b shrink-0 border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="text-xl shrink-0 leading-none">{project.icon}</span>
        <h1 className="font-semibold truncate text-[var(--text-primary)]">
          {project.name}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex rounded-lg border overflow-hidden border-[var(--border)]">
          <Link
            href={`/projects/${project.slug}`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              isBoard ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)]'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </Link>
          <Link
            href={`/projects/${project.slug}/list`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--border)]',
              isList ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)]'
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Link>
          <Link
            href={`/projects/${project.slug}/docs`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--border)]',
              isDocs ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)]'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Docs
          </Link>
        </div>

        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors bg-[var(--primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
