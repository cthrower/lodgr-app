'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/projects')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Background gradient blobs */}
      <div
        className="absolute top-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full opacity-[0.15] blur-[80px] pointer-events-none"
        style={{ background: 'var(--gradient-primary)' }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] h-[400px] w-[400px] rounded-full opacity-[0.12] blur-[80px] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
      />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            <span className="text-white font-bold text-2xl tracking-tight">L</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Lodgr</h1>
          <p className="text-sm mt-1.5 text-[var(--text-secondary)]">
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 shadow-[var(--shadow-lg)] border-[var(--border)] bg-[var(--surface)]"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-glow)] border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-glow)] border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: loading ? 'none' : 'var(--shadow-primary)',
              }}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.99]"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
