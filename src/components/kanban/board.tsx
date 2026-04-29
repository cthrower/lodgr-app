'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanColumn from './column'
import TaskCard, { type TaskCardData } from './task-card'
import TaskModal, { type ModalTask } from '@/components/task/task-modal'
import { moveTask } from '@/actions/tasks'
import { createColumn, reorderColumns } from '@/actions/columns'
import { Plus, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bgClassForColor, bgTintClassForColor, borderClassForColor, textClassForColor } from '@/lib/color-classes'

type ColumnData = {
  id: string
  name: string
  position: number
  colour: string | null
  tasks: TaskCardData[]
}

type Member = { id: string; name: string; avatarUrl: string | null }
type Label = { id: string; name: string; colour: string }

type Props = {
  project: { id: string; slug: string; columns: ColumnData[] }
  members: Member[]
  labels: Label[]
}

const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const
const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low', none: 'None',
}
const PRIORITY_COLOUR: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', none: 'var(--text-muted)',
}
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-[#ef4444]',
  high: 'bg-[#f97316]',
  medium: 'bg-[#eab308]',
  low: 'bg-[#3b82f6]',
  none: '',
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

export default function KanbanBoard({ project, members, labels }: Props) {
  const [columns, setColumns] = useState<ColumnData[]>(project.columns)
  const [activeTask, setActiveTask] = useState<TaskCardData | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  // Filters
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssigneeId, setFilterAssigneeId] = useState('')
  const [filterLabelId, setFilterLabelId] = useState('')
  const [filterDue, setFilterDue] = useState('')
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [showDueDropdown, setShowDueDropdown] = useState(false)
  const filtersActive = !!(filterPriority || filterAssigneeId || filterLabelId || filterDue)

  // Add column
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [savingCol, setSavingCol] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function isColumnId(id: string) {
    return columns.some((c) => c.id === id)
  }

  function findTask(id: string): TaskCardData | null {
    for (const col of columns) {
      const t = col.tasks.find((t) => t.id === id)
      if (t) return t
    }
    return null
  }

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterAssigneeId && t.assigneeId !== filterAssigneeId) return false
      if (filterLabelId && !t.labels.some(({ label }) => label.id === filterLabelId)) return false
      if (filterDue) {
        const today = new Date(new Date().toDateString())
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        if (filterDue === 'overdue' && due >= today) return false
        if (filterDue === 'today' && due.toDateString() !== today.toDateString()) return false
        if (filterDue === 'this-week') {
          const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (due < today || due >= weekEnd) return false
        }
      }
      return true
    }),
  }))

  const modalTask: ModalTask | null = openTaskId
    ? (() => {
        const t = findTask(openTaskId)
        if (!t) return null
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          columnId: t.columnId,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate ?? null,
          assignee: t.assignee,
          labels: t.labels,
        }
      })()
    : null

  function onDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    if (isColumnId(id)) {
      setActiveColumn(columns.find((c) => c.id === id) ?? null)
    } else {
      setActiveTask(findTask(id))
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    // Don't touch anything when dragging a column
    if (isColumnId(activeId)) return

    const fromIdx = columns.findIndex((c) => c.tasks.some((t) => t.id === activeId))
    const toIdx = columns.findIndex((c) => c.id === overId || c.tasks.some((t) => t.id === overId))

    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

    setColumns((cols) => {
      const updated = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const taskIdx = updated[fromIdx].tasks.findIndex((t) => t.id === activeId)
      const [task] = updated[fromIdx].tasks.splice(taskIdx, 1)
      task.columnId = updated[toIdx].id
      updated[toIdx].tasks.push(task)
      return updated
    })
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setActiveColumn(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Column reorder
    if (isColumnId(activeId)) {
      const fromIdx = columns.findIndex((c) => c.id === activeId)
      const toIdx = columns.findIndex((c) => c.id === overId)
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const reordered = arrayMove(columns, fromIdx, toIdx)
        setColumns(reordered)
        await reorderColumns(reordered.map((c, i) => ({ id: c.id, position: i })))
      }
      return
    }

    // Task reorder within same column
    const colIdx = columns.findIndex((c) => c.tasks.some((t) => t.id === activeId))
    if (colIdx === -1) return

    const col = columns[colIdx]
    const fromIdx = col.tasks.findIndex((t) => t.id === activeId)
    const toIdx = col.tasks.findIndex((t) => t.id === overId)

    if (fromIdx !== toIdx && toIdx !== -1) {
      setColumns((cols) => {
        const updated = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
        updated[colIdx].tasks = arrayMove(updated[colIdx].tasks, fromIdx, toIdx)
        return updated
      })
    }

    await moveTask({ taskId: activeId, columnId: col.id, position: fromIdx })
  }

  async function handleAddColumn() {
    if (!newColName.trim()) return
    setSavingCol(true)
    try {
      const col = await createColumn({ projectId: project.id, name: newColName })
      setColumns((prev) => [
        ...prev,
        { id: col.id, name: col.name, position: col.position, colour: col.colour, tasks: [] },
      ])
      setNewColName('')
      setAddingColumn(false)
    } finally {
      setSavingCol(false)
    }
  }

  function handleRenameColumn(id: string, name: string) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  }

  function handleDeleteColumn(id: string) {
    const targetId = columns.find((c) => c.id !== id)?.id
    setColumns((prev) => {
      const removed = prev.find((c) => c.id === id)
      const remaining = prev.filter((c) => c.id !== id)
      if (targetId && removed) {
        return remaining.map((c) =>
          c.id === targetId ? { ...c, tasks: [...c.tasks, ...removed.tasks] } : c
        )
      }
      return remaining
    })
  }

  const allColumns = columns.map((c) => ({ id: c.id, name: c.name }))
  const activeAssignee = members.find((m) => m.id === filterAssigneeId)
  const activeLabel = labels.find((l) => l.id === filterLabelId)
  const DUE_OPTIONS = [
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'this-week', label: 'This week' },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 border-[var(--border)] bg-[var(--surface)]">
        <span className="flex items-center gap-1.5 text-xs font-medium mr-1 text-[var(--text-muted)]">
          <SlidersHorizontal className="h-3 w-3" />
          Filter
        </span>

        {/* Priority filter */}
        <div className="flex gap-1">
          {PRIORITIES.filter((p) => p !== 'none').map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-150',
                filterPriority === p
                  ? `${borderClassForColor(PRIORITY_COLOUR[p])} ${bgTintClassForColor(PRIORITY_COLOUR[p])} ${textClassForColor(PRIORITY_COLOUR[p])}`
                  : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[p])} />
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Assignee filter */}
        <div className="relative">
          <button
            onClick={() => { setShowAssigneeDropdown((v) => !v); setShowLabelDropdown(false); setShowDueDropdown(false) }}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-150',
              filterAssigneeId
                ? 'border-[var(--primary)] bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]'
                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {activeAssignee ? activeAssignee.name : 'Assignee'}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showAssigneeDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border shadow-[var(--shadow-md)] z-30 overflow-hidden border-[var(--border)] bg-[var(--surface)]">
              <button
                onClick={() => { setFilterAssigneeId(''); setShowAssigneeDropdown(false) }}
                className="w-full px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              >
                Anyone
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setFilterAssigneeId(m.id); setShowAssigneeDropdown(false) }}
                  className={cn(
                    'w-full px-3 py-2 text-xs text-left transition-colors flex items-center gap-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                    filterAssigneeId === m.id ? 'bg-[var(--surface-hover)]' : ''
                  )}
                >
                  <div
                    style={avatarStyle(m.id)}
                    className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Label filter */}
        {labels.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setShowLabelDropdown((v) => !v); setShowAssigneeDropdown(false); setShowDueDropdown(false) }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-150',
                filterLabelId
                  ? `${borderClassForColor(activeLabel?.colour)} ${bgTintClassForColor(activeLabel?.colour)} ${textClassForColor(activeLabel?.colour)}`
                  : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {activeLabel ? (
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', bgClassForColor(activeLabel.colour))} />
              ) : null}
              {activeLabel ? activeLabel.name : 'Label'}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showLabelDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border shadow-[var(--shadow-md)] z-30 overflow-hidden border-[var(--border)] bg-[var(--surface)]">
                <button
                  onClick={() => { setFilterLabelId(''); setShowLabelDropdown(false) }}
                  className="w-full px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Any label
                </button>
                {labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setFilterLabelId(l.id); setShowLabelDropdown(false) }}
                    className={cn(
                      'w-full px-3 py-2 text-xs text-left transition-colors flex items-center gap-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                      filterLabelId === l.id ? 'bg-[var(--surface-hover)]' : ''
                    )}
                  >
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', bgClassForColor(l.colour))} />
                    <span className="truncate">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Due date filter */}
        <div className="relative">
          <button
            onClick={() => { setShowDueDropdown((v) => !v); setShowAssigneeDropdown(false); setShowLabelDropdown(false) }}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-150',
              filterDue
                ? 'border-[var(--primary)] bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]'
                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {filterDue ? DUE_OPTIONS.find((o) => o.id === filterDue)?.label : 'Due date'}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showDueDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border shadow-[var(--shadow-md)] z-30 overflow-hidden border-[var(--border)] bg-[var(--surface)]">
              <button
                onClick={() => { setFilterDue(''); setShowDueDropdown(false) }}
                className="w-full px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              >
                Any time
              </button>
              {DUE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setFilterDue(opt.id); setShowDueDropdown(false) }}
                  className={cn(
                    'w-full px-3 py-2 text-xs text-left transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                    filterDue === opt.id ? 'bg-[var(--surface-hover)]' : ''
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtersActive && (
          <button
            onClick={() => { setFilterPriority(''); setFilterAssigneeId(''); setFilterLabelId(''); setFilterDue('') }}
            className="flex items-center gap-1 text-xs ml-1 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 h-full px-4 py-4 overflow-x-auto">
            <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
              {filteredColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  projectId={project.id}
                  onTaskClick={(id) => setOpenTaskId(id)}
                  onRename={handleRenameColumn}
                  onDelete={handleDeleteColumn}
                  isOnlyColumn={columns.length === 1}
                />
              ))}
            </SortableContext>

            {/* Add column */}
            <div className="shrink-0 w-72">
              {addingColumn ? (
                <div className="rounded-2xl border p-3 border-[var(--border)] bg-[var(--surface-raised)]">
                  <input
                    autoFocus
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn()
                      if (e.key === 'Escape') { setAddingColumn(false); setNewColName('') }
                    }}
                    placeholder="Column name"
                    className="w-full text-sm bg-transparent focus:outline-none mb-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      disabled={savingCol || !newColName.trim()}
                      style={{ background: 'var(--gradient-primary)' }}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColName('') }}
                      className="rounded-lg p-1 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2.5 text-sm transition-all border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                >
                  <Plus className="h-4 w-4" />
                  Add column
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDragging />}
            {activeColumn && (
              <div
                className="w-72 rounded-2xl border px-3 py-2.5 shadow-[var(--shadow-lg)] border-[var(--primary)] bg-[var(--surface-raised)]"
                style={{ boxShadow: 'var(--shadow-primary)' }}
              >
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {activeColumn.name}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        task={modalTask}
        members={members}
        columns={allColumns}
        labels={labels}
        onClose={() => setOpenTaskId(null)}
      />
    </div>
  )
}
