'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { markAllNotificationsRead } from '@/actions/notifications'

type NotificationItem = {
  id: string
  type: string
  entityType: string
  entityTitle: string
  read: boolean
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  assigned: 'You were assigned a task',
  commented: 'Someone commented on your task',
  mentioned: 'You were mentioned',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount)
      setItems(data.items)
    } catch {
      // network error, ignore
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative h-7 w-7 rounded flex items-center justify-center transition-colors text-[var(--text-muted)]"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full flex items-center justify-center text-white text-[9px] bg-[#ef4444]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border shadow-2xl overflow-hidden z-50 border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="px-4 py-2.5 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Notifications
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No notifications yet
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 border-b last:border-0 border-[var(--border)] ${
                    item.read ? 'bg-transparent' : 'bg-[var(--surface-hover)]'
                  }`}
                >
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {TYPE_LABEL[item.type] ?? item.type}
                  </p>
                  {item.entityTitle && (
                    <p className="text-xs mt-0.5 truncate text-[var(--text-primary)]">
                      {item.entityTitle}
                    </p>
                  )}
                  <p className="text-xs mt-0.5 text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
