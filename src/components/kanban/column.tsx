'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard, { type TaskCardData } from './task-card'
import { Plus, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { createTask } from '@/actions/tasks'
import { updateColumn, deleteColumn } from '@/actions/columns'
import { bgClassForColor } from '@/lib/color-classes'
import { cn } from '@/lib/utils'

type ColumnData = {
  id: string
  name: string
  colour: string | null
  tasks: TaskCardData[]
}

type Props = {
  column: ColumnData
  projectId: string
  onTaskClick?: (taskId: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  isOnlyColumn: boolean
}

export default function KanbanColumn({
  column,
  projectId,
  onTaskClick,
  onRename,
  onDelete,
  isOnlyColumn,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(column.name)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = column.tasks.map((t) => t.id)

  async function handleAddTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await createTask({ projectId, columnId: column.id, title: newTitle })
      setNewTitle('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddTask()
    if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
  }

  async function handleRename() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === column.name) {
      setEditing(false)
      setEditName(column.name)
      return
    }
    onRename(column.id, trimmed)
    setEditing(false)
    await updateColumn({ id: column.id, name: trimmed })
  }

  async function handleDelete() {
    setMenuOpen(false)
    const msg = isOnlyColumn
      ? 'This is the only column. All tasks will be deleted. Continue?'
      : 'Delete this column? Tasks will be moved to the first remaining column.'
    if (!confirm(msg)) return
    onDelete(column.id)
    await deleteColumn(column.id)
  }

  return (
    <div
      className="flex flex-col w-72 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--sidebar-bg)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {column.colour && (
            <div className={cn('h-2 w-2 rounded-full shrink-0', bgClassForColor(column.colour))} />
          )}

          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setEditing(false); setEditName(column.name) }
              }}
              className="text-sm font-medium bg-transparent focus:outline-none border-b w-full text-[var(--text-primary)] border-[var(--primary)]"
            />
          ) : (
            <>
              <span className="text-sm font-medium truncate text-[var(--text-primary)]">
                {column.name}
              </span>
              <span className="text-xs rounded-full px-1.5 py-0.5 shrink-0 bg-[var(--border)] text-[var(--text-muted)]">
                {column.tasks.length}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setAdding(true)}
            className="h-6 w-6 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
            title="Add task"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Column menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-6 w-6 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
              title="Column options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-36 rounded-lg border shadow-lg z-20 overflow-hidden border-[var(--border)] bg-[var(--surface)]"
                >
                  <button
                    onClick={() => { setMenuOpen(false); setEditing(true); setEditName(column.name) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete column
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-16 px-2 pb-2 space-y-2 overflow-y-auto transition-colors rounded-b-xl',
          isOver ? 'bg-[var(--surface-hover)]' : 'bg-transparent'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task.id)}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && !adding && (
          <p
            className="text-xs text-center py-4 text-[var(--text-muted)]"
          >
            No tasks
          </p>
        )}

        {adding && (
          <div className="rounded-lg border p-2 border-[var(--primary)] bg-[var(--surface)]">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title"
              className="w-full text-sm bg-transparent focus:outline-none text-[var(--text-primary)]"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddTask}
                disabled={saving || !newTitle.trim()}
                className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50 bg-[var(--primary)]"
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle('') }}
                className="rounded p-1 transition-colors text-[var(--text-muted)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
