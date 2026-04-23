'use client'

import { useSortable } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { bgClassForColor } from '@/lib/color-classes'

const PRIORITY_COLOUR_CLASS: Record<string, string> = {
  urgent: 'text-[#ef4444]',
  high: 'text-[#f97316]',
  medium: 'text-[#eab308]',
  low: 'text-[#3b82f6]',
  none: 'text-transparent',
}

const PRIORITY_ICON: Record<string, string> = {
  urgent: '!!',
  high: '!',
  medium: '~',
  low: '↓',
  none: '',
}

export type TaskCardData = {
  id: string
  title: string
  description: unknown
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent'
  columnId: string
  assigneeId: string | null
  dueDate?: string | null
  assignee: { id: string; name: string; avatarUrl: string | null } | null
  labels: { label: { id: string; name: string; colour: string } }[]
}

type Props = {
  task: TaskCardData
  isDragging?: boolean
  onClick?: () => void
}

export default function TaskCard({ task, isDragging, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const isOverdue =
    task.dueDate != null && new Date(task.dueDate) < new Date(new Date().toDateString())

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 cursor-pointer active:cursor-grabbing transition-shadow select-none border-[var(--border)] bg-[var(--surface)]',
        isSortableDragging || isDragging ? 'opacity-40 shadow-lg' : 'hover:shadow-sm'
      )}
    >
      {task.labels.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className={cn('text-xs px-1.5 py-0.5 rounded-full text-white font-medium', bgClassForColor(label.colour))}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm leading-snug text-[var(--text-primary)]">
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          {task.priority !== 'none' && (
            <span
              className={cn('text-xs font-bold', PRIORITY_COLOUR_CLASS[task.priority] ?? 'text-transparent')}
              title={task.priority}
            >
              {PRIORITY_ICON[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn('text-xs font-medium', isOverdue ? 'text-[#ef4444]' : 'text-[var(--text-muted)]')}
              title={isOverdue ? 'Overdue' : undefined}
            >
              {isOverdue && '⚠ '}
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        {task.assignee && (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 bg-[var(--primary)]"
            title={task.assignee.name}
          >
            {task.assignee.name[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
