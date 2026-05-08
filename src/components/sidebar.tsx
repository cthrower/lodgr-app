'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  FileText, Settings, LogOut, Plus, Moon, Sun,
  ChevronRight, ChevronDown, PanelLeftClose,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from '@/components/notification-bell'

type SidebarProps = {
  user: { id: string; name: string; email: string; avatarUrl: string | null }
  workspace: { name: string; slug: string }
  projects: { id: string; name: string; slug: string; colour: string; icon: string; docs: { id: string; title: string; slug: string }[] }[]
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

export default function Sidebar({ user, workspace, projects }: SidebarProps) {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Persist theme & sidebar state
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved === 'true') setCollapsed(true)
    } catch { /* ignore */ }
  }, [])

  // Cmd+\ toggles sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setCollapsed((v) => {
          const next = !v
          try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* ignore */ }
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.theme = next ? 'dark' : 'light' } catch { /* ignore */ }
  }

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* ignore */ }
      return next
    })
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col shrink-0 border-r transition-[width] duration-200 ease-in-out overflow-hidden',
          'border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]',
          collapsed ? 'w-0' : 'w-60'
        )}
      >
        {/* Workspace header */}
        <div className="flex items-center gap-2.5 px-3 py-3.5 border-b border-[var(--sidebar-border)] shrink-0">
          <div
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
          >
            {workspace.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
              {workspace.name}
            </p>
            <p className="text-xs truncate text-[var(--text-muted)]">
              {user.email}
            </p>
          </div>
          <button
            onClick={toggle}
            title="Collapse sidebar (⌘\)"
            className="h-6 w-6 rounded-md flex items-center justify-center transition-all shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Projects section */}
          <div>
            <button
              onClick={() => setProjectsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2 mb-1 group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Projects
              </span>
              <div className="flex items-center gap-0.5">
                <Link
                  href="/projects/new"
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 rounded-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  title="New project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Link>
                <span className="h-4 w-4 flex items-center justify-center">
                  <ChevronDown className={cn('h-3 w-3 transition-transform text-[var(--text-muted)]', !projectsOpen && '-rotate-90')} />
                </span>
              </div>
            </button>

            {projectsOpen && (
              <ul className="space-y-0.5">
                {projects.map((project) => {
                  const isActive = pathname.startsWith(`/projects/${project.slug}`)
                  const isExpanded = expandedProjects.has(project.id)
                  const hasDocs = project.docs.length > 0
                  return (
                    <li key={project.id}>
                      <div className="flex items-center gap-0.5 group/project">
                        {hasDocs ? (
                          <button
                            onClick={() => setExpandedProjects((prev) => {
                              const next = new Set(prev)
                              if (next.has(project.id)) next.delete(project.id)
                              else next.add(project.id)
                              return next
                            })}
                            className="h-6 w-4 flex items-center justify-center shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <ChevronDown className={cn('h-3 w-3 transition-transform', !isExpanded && '-rotate-90')} />
                          </button>
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}
                        <Link
                          href={`/projects/${project.slug}`}
                          style={isActive ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : undefined}
                          className={cn(
                            'flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all duration-150 min-w-0',
                            isActive
                              ? 'font-medium'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                          )}
                        >
                          <span className="shrink-0 text-base leading-none">{project.icon}</span>
                          <span className="truncate">{project.name}</span>
                        </Link>
                      </div>
                      {isExpanded && hasDocs && (
                        <ul className="ml-7 mt-0.5 space-y-0.5">
                          {project.docs.map((doc) => {
                            const docActive = pathname === `/docs/${doc.slug}`
                            return (
                              <li key={doc.id}>
                                <Link
                                  href={`/docs/${doc.slug}`}
                                  style={docActive ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : undefined}
                                  className={cn(
                                    'flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-all duration-150',
                                    docActive
                                      ? 'font-medium'
                                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                                  )}
                                >
                                  <FileText className="h-3 w-3 shrink-0 opacity-60" />
                                  <span className="truncate">{doc.title}</span>
                                </Link>
                              </li>
                            )
                          })}
                          <li>
                            <Link
                              href={`/projects/${project.slug}/docs`}
                              className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-all text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span>New doc</span>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                  )
                })}
                {projects.length === 0 && (
                  <li>
                    <Link
                      href="/projects/new"
                      className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Plus className="h-3 w-3" />
                      Create a project
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Workspace section */}
          <div>
            <button
              onClick={() => setWorkspaceOpen((v) => !v)}
              className="w-full flex items-center justify-between px-2 mb-1 mt-3"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Workspace
              </span>
              <ChevronDown className={cn('h-3 w-3 transition-transform text-[var(--text-muted)]', !workspaceOpen && '-rotate-90')} />
            </button>

            {workspaceOpen && (
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/docs"
                    style={pathname.startsWith('/docs') ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all duration-150',
                      pathname.startsWith('/docs')
                        ? 'font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Docs</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-[var(--sidebar-border)] p-2 space-y-0.5 shrink-0">
          {/* User row */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div
              style={avatarStyle(user.id)}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            >
              {user.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate flex-1 min-w-0 text-[var(--text-secondary)]">
              {user.name}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <NotificationBell />
              <button
                onClick={toggleDark}
                className="h-6 w-6 rounded-md flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Collapsed reveal tab */}
      {collapsed && (
        <button
          onClick={toggle}
          title="Open sidebar (⌘\)"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center h-10 w-5 rounded-r-lg border-r border-t border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all hover:w-6 shadow-[var(--shadow-sm)]"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </>
  )
}
