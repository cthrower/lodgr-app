'use client'

import { useSortable } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { bgClassForColor } from '@/lib/color-classes'
import { Calendar } from 'lucide-react'

const PRIORITY_LEFT_BORDER: Record<string, string> = {
  urgent: 'border-l-[3px] border-l-[#ef4444]',
  high: 'border-l-[3px] border-l-[#f97316]',
  medium: 'border-l-[3px] border-l-[#eab308]',
  low: 'border-l-[3px] border-l-[#3b82f6]',
  none: 'border-l-[3px] border-l-transparent',
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.7)]',
  high: 'bg-[#f97316]',
  medium: 'bg-[#eab308]',
  low: 'bg-[#3b82f6]',
  none: '',
}

const PRIORITY_TITLE: Record<string, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low', none: '',
}

const AVATAR_COLORS = [
  ['#6366f1', '#a855f7'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#14b8a6'],
  ['#f97316', '#ef4444'],
  ['#ec4899', '#f43f5e'],
  ['#8b5cf6', '#6366f1'],
  ['#f59e0b', '#f97316'],
  ['#06b6d4', '#3b82f6'],
]

function avatarStyle(str: string): React.CSSProperties {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const [a, b] = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
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
        'rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer active:cursor-grabbing select-none transition-all duration-150',
        PRIORITY_LEFT_BORDER[task.priority] ?? PRIORITY_LEFT_BORDER.none,
        isSortableDragging || isDragging
          ? 'opacity-40 shadow-[var(--shadow-lg)] rotate-1'
          : 'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px'
      )}
    >
      <div className="p-3">
        {task.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {task.labels.map(({ label }) => (
              <span
                key={label.id}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full text-white font-semibold tracking-wide',
                  bgClassForColor(label.colour)
                )}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm leading-snug text-[var(--text-primary)] font-medium">
          {task.title}
        </p>

        <div className="flex items-center justify-between mt-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {task.priority !== 'none' && (
              <span
                className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])}
                title={PRIORITY_TITLE[task.priority]}
              />
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[11px] font-medium',
                  isOverdue ? 'text-[#ef4444]' : 'text-[var(--text-muted)]'
                )}
              >
                <Calendar className="h-3 w-3 shrink-0" />
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          {task.assignee && (
            <div
              style={avatarStyle(task.assignee.id)}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              title={task.assignee.name}
            >
              {task.assignee.name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
