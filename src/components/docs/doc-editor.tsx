'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Check, FileText, Plus, Trash2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/tiptap'
import { updateDoc, deleteDoc, createChildDoc } from '@/actions/docs'

function extractText(nodes: unknown[]): string {
  return nodes
    .map((n: unknown) => {
      if (!n || typeof n !== 'object') return ''
      const node = n as Record<string, unknown>
      if (node.type === 'text') return (node.text as string) ?? ''
      if (Array.isArray(node.content)) return extractText(node.content as unknown[])
      return ''
    })
    .join(' ')
}

function countWords(body: unknown): number {
  if (!body || typeof body !== 'object') return 0
  const b = body as Record<string, unknown>
  if (b.type === 'doc' && Array.isArray(b.content)) {
    const text = extractText(b.content)
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }
  return 0
}

type DocData = {
  id: string
  title: string
  body: unknown
  slug: string
  projectId: string | null
  projectSlug: string | null
  projectName: string | null
  parentId: string | null
  children: { id: string; title: string; slug: string }[]
}

export default function DocEditor({ doc }: { doc: DocData }) {
  const [title, setTitle] = useState(doc.title)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const descSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setWordCount(countWords(doc.body))
  }, [doc.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function flashSaved() {
    setSavedFlash(true)
    if (savedFlashRef.current) clearTimeout(savedFlashRef.current)
    savedFlashRef.current = setTimeout(() => setSavedFlash(false), 2200)
  }

  const handleContentChange = useCallback(
    (json: unknown) => {
      if (descSaveRef.current) clearTimeout(descSaveRef.current)
      setSaving(true)
      setWordCount(countWords(json))
      descSaveRef.current = setTimeout(async () => {
        try {
          await updateDoc({ id: doc.id, body: json })
          flashSaved()
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [doc.id]
  )

  async function saveTitle() {
    if (!title.trim() || title === doc.title) return
    await updateDoc({ id: doc.id, title: title.trim() })
    flashSaved()
  }

  async function handleAddSubpage() {
    await createChildDoc({ parentId: doc.id, projectId: doc.projectId ?? undefined })
  }

  async function handleDelete() {
    if (!confirm('Delete this doc and all its subpages?')) return
    await deleteDoc(doc.id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-1.5 px-8 py-2.5 border-b text-xs shrink-0 border-[var(--border)] text-[var(--text-muted)]"
      >
        <Link href="/docs" className="text-[var(--text-muted)]">Docs</Link>
        {doc.projectName && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/projects/${doc.projectSlug}/docs`} className="text-[var(--text-muted)]">
              {doc.projectName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--text-secondary)]">{title || 'Untitled'}</span>
        <span className="ml-auto flex items-center gap-2">
          {saving && <span className="text-[var(--text-muted)] animate-pulse">Saving…</span>}
          {!saving && savedFlash && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {wordCount > 0 && (
            <span className="text-[var(--text-muted)]">
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Title */}
          <div className="flex items-start gap-3 mb-8">
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  document.querySelector<HTMLElement>('.ProseMirror')?.focus()
                }
              }}
              className="flex-1 text-4xl font-bold bg-transparent focus:outline-none leading-tight text-[var(--text-primary)]"
              placeholder="Untitled"
            />
            <div className="flex items-center gap-1 mt-2 shrink-0">
              <button
                onClick={handleAddSubpage}
                className="h-7 w-7 rounded flex items-center justify-center transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                title="Add subpage"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="h-7 w-7 rounded flex items-center justify-center transition-colors hover:text-red-500 text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Delete doc"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <TiptapEditor
            content={doc.body}
            onChange={handleContentChange}
            placeholder="Start writing, or type / for commands…"
            className="border-0 shadow-none"
          />

          {/* Sub-pages */}
          <div className="mt-10 pt-6 border-t border-[var(--border)]">
            {doc.children.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
                Sub-pages
              </p>
              <div className="space-y-0.5">
                {doc.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/docs/${child.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    {child.title}
                  </Link>
                ))}
              </div>
              </>
            )}
            <button
              onClick={handleAddSubpage}
              className="flex items-center gap-2 mt-3 text-sm transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <Plus className="h-4 w-4" />
              Add sub-page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
