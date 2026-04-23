'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { inviteUser } from '@/actions/users'

export default function InviteForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)
    try {
      const fd = new FormData()
      fd.set('email', email)
      const user = await inviteUser(fd)
      setEmail('')
      setStatus('success')
      setMessage(`Invite sent to ${user.email}. They'll receive login credentials by email.`)
      setTimeout(() => { setStatus('idle'); setMessage(null) }, 5000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-opacity bg-[var(--primary)]"
        >
          <UserPlus className="h-4 w-4" />
          {status === 'loading' ? 'Sending…' : 'Invite'}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
