'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FolderKanban, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchResult = {
  id: string
  type: 'project' | 'doc' | 'task'
  title: string
  meta: string | null
  href: string
  icon: string | null
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setSelected(0)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  function go(result: SearchResult) {
    router.push(result.href)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected])
    if (e.key === 'Escape') setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden border-[var(--border)] bg-[var(--surface)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, docs, projects…"
            className="flex-1 text-sm bg-transparent focus:outline-none text-[var(--text-primary)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--text-muted)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              Searching…
            </p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {!query && (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              Type to search
            </p>
          )}
          {results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => go(result)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                i === selected ? 'bg-[var(--surface-hover)]' : 'bg-transparent'
              )}
            >
              <span className="shrink-0 text-[var(--text-muted)]">
                {result.type === 'project' && (result.icon ? (
                  <span className="text-base">{result.icon}</span>
                ) : (
                  <FolderKanban className="h-4 w-4" />
                ))}
                {result.type === 'doc' && <FileText className="h-4 w-4" />}
                {result.type === 'task' && (
                  <span className="h-4 w-4 inline-flex items-center justify-center rounded border text-xs font-bold border-[var(--border)]">T</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-[var(--text-primary)]">{result.title}</p>
                {result.meta && (
                  <p className="text-xs truncate text-[var(--text-muted)]">{result.meta}</p>
                )}
              </div>
              <span
                className="text-xs shrink-0 rounded px-1.5 py-0.5 bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                {result.type}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t text-xs border-[var(--border)] text-[var(--text-muted)]">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  )
}
