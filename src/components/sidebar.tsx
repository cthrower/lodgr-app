'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { FileText, Settings, LogOut, Plus, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from '@/components/notification-bell'

type SidebarProps = {
  user: { id: string; name: string; email: string; avatarUrl: string | null }
  workspace: { name: string; slug: string }
  projects: { id: string; name: string; slug: string; colour: string; icon: string }[]
}

export default function Sidebar({ user, workspace, projects }: SidebarProps) {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.theme = next ? 'dark' : 'light'
    } catch {
      // ignore
    }
  }

  return (
    <aside
      className="w-60 flex flex-col shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
    >
      {/* Workspace header */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-b border-[var(--sidebar-border)]"
      >
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-white text-xs font-bold bg-[var(--primary)]"
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
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Projects */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span
              className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
            >
              Projects
            </span>
            <Link
              href="/projects/new"
              className="h-5 w-5 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
              title="New project"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ul className="space-y-0.5">
            {projects.map((project) => {
              const isActive = pathname.startsWith(`/projects/${project.slug}`)
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'font-medium bg-[var(--surface-hover)] text-[var(--text-primary)]'
                        : 'bg-transparent text-[var(--text-secondary)]'
                    )}
                  >
                    <span className="shrink-0 text-base leading-none">{project.icon}</span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              )
            })}
            {projects.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-[var(--text-muted)]">
                No projects yet
              </li>
            )}
          </ul>
        </div>

        {/* Workspace */}
        <div>
          <div className="px-2 mb-1">
            <span
              className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
            >
              Workspace
            </span>
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/docs"
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  pathname.startsWith('/docs')
                    ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-secondary)]'
                )}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>Docs</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t px-2 py-2 space-y-0.5 border-[var(--sidebar-border)]">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <NotificationBell />
          <button
            onClick={toggleDark}
            className="h-7 w-7 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-[var(--text-secondary)]"
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-[var(--text-secondary)]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
