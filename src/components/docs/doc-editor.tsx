'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, FileText, Plus, Trash2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/tiptap'
import { updateDoc, deleteDoc, createChildDoc } from '@/actions/docs'

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
  const descSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleContentChange = useCallback(
    (json: unknown) => {
      if (descSaveRef.current) clearTimeout(descSaveRef.current)
      setSaving(true)
      descSaveRef.current = setTimeout(async () => {
        try {
          await updateDoc({ id: doc.id, body: json })
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
        {saving && <span className="ml-1 text-[var(--text-muted)]">· Saving…</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Title */}
          <div className="flex items-start gap-3 mb-8">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="flex-1 text-4xl font-bold bg-transparent focus:outline-none leading-tight text-[var(--text-primary)]"
              placeholder="Untitled"
            />
            <div className="flex items-center gap-1 mt-2 shrink-0">
              <button
                onClick={handleAddSubpage}
                className="h-7 w-7 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
                title="Add subpage"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="h-7 w-7 rounded flex items-center justify-center transition-colors hover:text-red-500 text-[var(--text-muted)]"
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
            placeholder="Start writing… (use / for commands)"
            className="border-0 shadow-none"
          />

          {/* Sub-pages */}
          {doc.children.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[var(--border)]">
              <p className="text-sm font-medium mb-3 text-[var(--text-secondary)]">
                Sub-pages
              </p>
              <div className="space-y-0.5">
                {doc.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/docs/${child.slug}`}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors text-[var(--text-secondary)]"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    {child.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
