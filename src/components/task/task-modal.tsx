'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Flag, Calendar, User, Trash2, Tag, Paperclip, MessageSquare, Download } from 'lucide-react'
import TiptapEditor from '@/components/editor/tiptap'
import { updateTask, deleteTask } from '@/actions/tasks'
import { toggleLabelOnTask } from '@/actions/labels'
import { createComment, deleteComment } from '@/actions/comments'
import { cn } from '@/lib/utils'
import { bgClassForColor, textClassForColor } from '@/lib/color-classes'

const PRIORITIES = [
  { value: 'none', label: 'None', colour: '#6b7280' },
  { value: 'low', label: 'Low', colour: '#3b82f6' },
  { value: 'medium', label: 'Medium', colour: '#eab308' },
  { value: 'high', label: 'High', colour: '#f97316' },
  { value: 'urgent', label: 'Urgent', colour: '#ef4444' },
] as const

type TaskPriority = (typeof PRIORITIES)[number]['value']

export type ModalTask = {
  id: string
  title: string
  description: unknown
  priority: TaskPriority
  columnId: string
  assigneeId: string | null
  dueDate: string | null
  assignee: { id: string; name: string; avatarUrl: string | null } | null
  labels: { label: { id: string; name: string; colour: string } }[]
}

type Comment = {
  id: string
  body: unknown
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

type Attachment = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy: { name: string }
}

type Label = { id: string; name: string; colour: string }

type Props = {
  task: ModalTask | null
  members: { id: string; name: string; avatarUrl: string | null }[]
  columns: { id: string; name: string }[]
  labels: Label[]
  onClose: () => void
}

type Tab = 'description' | 'comments' | 'attachments'

function getCommentText(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const b = body as Record<string, unknown>
  if (typeof b.text === 'string') return b.text
  if (b.type === 'doc' && Array.isArray(b.content)) {
    return b.content
      .map((node: Record<string, unknown>) =>
        Array.isArray(node.content)
          ? (node.content as Record<string, unknown>[]).map((l) => l.text ?? '').join('')
          : ''
      )
      .join('\n')
  }
  return ''
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TaskModal({ task, members, columns, labels, onClose }: Props) {
  const router = useRouter()

  // Core fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<unknown>(null)
  const [priority, setPriority] = useState<TaskPriority>('none')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [columnId, setColumnId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedLabelIds, setAssignedLabelIds] = useState<string[]>([])

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('description')

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const titleRef = useRef<HTMLInputElement>(null)
  const descSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description)
    setPriority(task.priority)
    setAssigneeId(task.assigneeId)
    setColumnId(task.columnId)
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    setAssignedLabelIds(task.labels.map((l) => l.label.id))
    setActiveTab('description')
    setComments([])
    setAttachments([])
    setTimeout(() => titleRef.current?.select(), 50)
  }, [task?.id])

  // Load comments and attachments when their tab is opened
  useEffect(() => {
    if (!task?.id || activeTab !== 'comments' || comments.length > 0) return
    setCommentsLoading(true)
    fetch(`/api/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .finally(() => setCommentsLoading(false))
  }, [activeTab, task?.id])

  useEffect(() => {
    if (!task?.id || activeTab !== 'attachments' || attachments.length > 0) return
    fetch(`/api/tasks/${task.id}/attachments`)
      .then((r) => r.json())
      .then(setAttachments)
  }, [activeTab, task?.id])

  const saveField = useCallback(
    async (fields: Partial<Parameters<typeof updateTask>[1]>) => {
      if (!task) return
      await updateTask(task.id, fields)
    },
    [task]
  )

  function handleDescChange(json: unknown) {
    setDescription(json)
    if (descSaveRef.current) clearTimeout(descSaveRef.current)
    descSaveRef.current = setTimeout(() => saveField({ description: json }), 800)
  }

  async function handleClose() {
    if (descSaveRef.current) {
      clearTimeout(descSaveRef.current)
      await saveField({ description })
    }
    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!task || !confirm('Delete this task? This cannot be undone.')) return
    await deleteTask(task.id)
    router.refresh()
    onClose()
  }

  async function handleLabelToggle(labelId: string) {
    if (!task) return
    const active = !assignedLabelIds.includes(labelId)
    setAssignedLabelIds((prev) =>
      active ? [...prev, labelId] : prev.filter((id) => id !== labelId)
    )
    await toggleLabelOnTask({ taskId: task.id, labelId, active })
  }

  async function handlePostComment() {
    if (!task || !commentText.trim()) return
    setPostingComment(true)
    try {
      const body = { text: commentText.trim() }
      const comment = await createComment({ taskId: task.id, body })
      setComments((prev) => [
        ...prev,
        { ...comment, createdAt: comment.createdAt.toISOString() } as Comment,
      ])
      setCommentText('')
    } finally {
      setPostingComment(false)
    }
  }

  async function handleDeleteComment(id: string) {
    if (!confirm('Delete this comment?')) return
    await deleteComment(id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !task) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const attachment = await res.json()
        setAttachments((prev) => [...prev, attachment])
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (!confirm('Delete this attachment?')) return
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const isOverdue = dueDate && new Date(dueDate) < new Date(new Date().toDateString())

  if (!task) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-2xl rounded-xl border shadow-2xl flex flex-col max-h-[88vh] border-[var(--border)] bg-[var(--surface)]"
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      >
        {/* Title row */}
        <div
          className="flex items-start gap-3 px-5 pt-5 pb-4 border-b shrink-0 border-[var(--border)]"
        >
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && saveField({ title: title.trim() })}
            className="flex-1 text-lg font-semibold bg-transparent focus:outline-none text-[var(--text-primary)]"
            placeholder="Task title"
          />
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <button
              onClick={handleDelete}
              className="h-7 w-7 rounded flex items-center justify-center transition-colors hover:text-red-500 text-[var(--text-muted)]"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="h-7 w-7 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div
              className="flex border-b shrink-0 px-5 gap-5 border-[var(--border)]"
            >
              {(['description', 'comments', 'attachments'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors',
                    activeTab === tab ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)]'
                  )}
                >
                  {tab}
                  {tab === 'comments' && comments.length > 0 && (
                    <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                      {comments.length}
                    </span>
                  )}
                  {tab === 'attachments' && attachments.length > 0 && (
                    <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                      {attachments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Description */}
              {activeTab === 'description' && (
                <TiptapEditor
                  content={description}
                  onChange={handleDescChange}
                  placeholder="Add a description…"
                />
              )}

              {/* Comments */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {commentsLoading && (
                    <p className="text-sm text-center py-4 text-[var(--text-muted)]">
                      Loading…
                    </p>
                  )}
                  {!commentsLoading && comments.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare
                        className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]"
                      />
                      <p className="text-sm text-[var(--text-muted)]">
                        No comments yet
                      </p>
                    </div>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5 bg-[var(--primary)]"
                      >
                        {comment.author.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="rounded-lg px-3 py-2 text-sm bg-[var(--sidebar-bg)] text-[var(--text-primary)]">
                          {getCommentText(comment.body) || '(empty)'}
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs mt-1 transition-colors text-[var(--text-muted)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New comment */}
                  <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-1 bg-[var(--primary)]"
                    >
                      ?
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment()
                        }}
                        placeholder="Write a comment… (⌘+Enter to post)"
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none border-[var(--border)] bg-[var(--sidebar-bg)] text-[var(--text-primary)]"
                      />
                      <button
                        onClick={handlePostComment}
                        disabled={postingComment || !commentText.trim()}
                        className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 bg-[var(--primary)]"
                      >
                        {postingComment ? 'Posting…' : 'Post comment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {activeTab === 'attachments' && (
                <div className="space-y-3">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm transition-colors disabled:opacity-50 border-[var(--border)] text-[var(--text-secondary)]"
                    >
                      <Paperclip className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload file (max 50 MB)'}
                    </button>
                  </div>

                  {attachments.length === 0 && !uploading && (
                    <div className="text-center py-8">
                      <Paperclip
                        className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]"
                      />
                      <p className="text-sm text-[var(--text-muted)]">
                        No attachments yet
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2.5 border-[var(--border)] bg-[var(--sidebar-bg)]"
                      >
                        <Paperclip
                          className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                            {att.filename}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatBytes(att.sizeBytes)} · {att.uploadedBy.name}
                          </p>
                        </div>
                        <a
                          href={`/api/attachments/${att.id}`}
                          download={att.filename}
                          className="h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0 text-[var(--text-muted)]"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0 hover:text-red-500 text-[var(--text-muted)]"
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div
            className="w-52 shrink-0 border-l overflow-y-auto p-4 space-y-5 border-[var(--border)] bg-[var(--sidebar-bg)]"
          >
            {/* Status */}
            <div>
              <p
                className="text-xs font-medium mb-1.5 uppercase tracking-wide text-[var(--text-muted)]"
              >
                Status
              </p>
              <select
                value={columnId}
                onChange={(e) => {
                  setColumnId(e.target.value)
                  saveField({ columnId: e.target.value })
                }}
                className="w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <p
                className="text-xs font-medium mb-1.5 uppercase tracking-wide flex items-center gap-1 text-[var(--text-muted)]"
              >
                <Flag className="h-3 w-3" />
                Priority
              </p>
              <div className="space-y-0.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPriority(p.value)
                      saveField({ priority: p.value as ModalTask['priority'] })
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors',
                      priority === p.value ? 'bg-[var(--surface-hover)] font-semibold' : 'bg-transparent font-normal',
                      priority === p.value ? textClassForColor(p.colour) : 'text-[var(--text-secondary)]'
                    )}
                  >
                    <span
                      className={cn('h-2 w-2 rounded-full shrink-0', bgClassForColor(p.colour))}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p
                className="text-xs font-medium mb-1.5 uppercase tracking-wide flex items-center gap-1 text-[var(--text-muted)]"
              >
                <User className="h-3 w-3" />
                Assignee
              </p>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setAssigneeId(null)
                    saveField({ assigneeId: null })
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors text-[var(--text-secondary)]',
                    !assigneeId ? 'bg-[var(--surface-hover)]' : 'bg-transparent'
                  )}
                >
                  None
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setAssigneeId(m.id)
                      saveField({ assigneeId: m.id })
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors text-[var(--text-secondary)]',
                      assigneeId === m.id ? 'bg-[var(--surface-hover)] font-semibold' : 'bg-transparent font-normal'
                    )}
                  >
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 bg-[var(--primary)]"
                    >
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <p
                className="text-xs font-medium mb-1.5 uppercase tracking-wide flex items-center gap-1 text-[var(--text-muted)]"
              >
                <Calendar className="h-3 w-3" />
                Due date
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  saveField({ dueDate: e.target.value ? new Date(e.target.value) : null })
                }}
                className={cn(
                  'w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none bg-[var(--surface)]',
                  isOverdue ? 'border-[#ef4444] text-[#ef4444]' : 'border-[var(--border)] text-[var(--text-primary)]'
                )}
              />
              {dueDate && (
                <button
                  onClick={() => {
                    setDueDate('')
                    saveField({ dueDate: null })
                  }}
                  className="text-xs mt-1.5 transition-colors text-[var(--text-muted)]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Labels */}
            <div>
              <p
                className="text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1 text-[var(--text-muted)]"
              >
                <Tag className="h-3 w-3" />
                Labels
              </p>
              {labels.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Create labels in Settings.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => {
                    const assigned = assignedLabelIds.includes(label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => handleLabelToggle(label.id)}
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium transition-opacity text-white',
                          bgClassForColor(label.colour),
                          assigned ? 'opacity-100' : 'opacity-30'
                        )}
                        title={assigned ? 'Remove label' : 'Add label'}
                      >
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
