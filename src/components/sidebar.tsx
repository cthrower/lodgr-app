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
    <aside className="w-60 flex flex-col shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]">
      {/* Workspace header */}
      <div className="flex items-center gap-2.5 px-3 py-3.5 border-b border-[var(--sidebar-border)]">
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
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Projects */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Projects
            </span>
            <Link
              href="/projects/new"
              className="h-5 w-5 rounded-md flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
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
                    style={isActive ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)' } : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all duration-150',
                      isActive
                        ? 'font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
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
          <div className="px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Workspace
            </span>
          </div>
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
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--sidebar-border)] p-2 space-y-0.5">
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
  )
}
