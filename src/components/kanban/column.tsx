'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard, { type TaskCardData } from './task-card'
import { Plus, X, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react'
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

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isColumnDragging,
    isOver,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] transition-opacity',
        isColumnDragging ? 'opacity-40' : 'opacity-100'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2.5 gap-1">
        {/* Drag handle */}
        <button
          {...listeners}
          className="shrink-0 h-6 w-5 flex items-center justify-center rounded cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          title="Drag to reorder column"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {column.colour && (
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', bgClassForColor(column.colour))} />
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
              className="text-sm font-semibold bg-transparent focus:outline-none border-b w-full text-[var(--text-primary)] border-[var(--primary)]"
            />
          ) : (
            <>
              <span className="text-sm font-semibold truncate text-[var(--text-primary)]">
                {column.name}
              </span>
              <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0 min-w-[1.25rem] text-center bg-[var(--surface-hover)] text-[var(--text-muted)]">
                {column.tasks.length}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setAdding(true)}
            className="h-6 w-6 rounded-md flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            title="Add task"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-6 w-6 rounded-md flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              title="Column options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border shadow-[var(--shadow-md)] z-20 overflow-hidden border-[var(--border)] bg-[var(--surface)]">
                  <button
                    onClick={() => { setMenuOpen(false); setEditing(true); setEditName(column.name) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-red-500 hover:bg-[var(--surface-hover)]"
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
        className={cn(
          'flex-1 min-h-16 px-2 pb-2 space-y-2 overflow-y-auto rounded-b-2xl transition-colors duration-150',
          isOver ? 'bg-[var(--nav-active-bg)]' : 'bg-transparent'
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
          <p className="text-xs text-center py-6 text-[var(--text-muted)]">
            No tasks
          </p>
        )}

        {adding && (
          <div className="rounded-xl border p-2.5 border-[var(--primary)] bg-[var(--surface)] shadow-[0_0_0_3px_var(--primary-glow)]">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title"
              className="w-full text-sm bg-transparent focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddTask}
                disabled={saving || !newTitle.trim()}
                style={{ background: 'var(--gradient-primary)' }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle('') }}
                className="rounded-lg p-1 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
