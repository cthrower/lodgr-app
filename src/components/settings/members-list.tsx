'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, Clock } from 'lucide-react'
import { deleteUser, resendInvite } from '@/actions/users'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  name: string
  email: string
  role: string
  invitePending: boolean
}

export default function MembersList({
  members,
  currentUserId,
  isOwner,
}: {
  members: Member[]
  currentUserId: string
  isOwner: boolean
}) {
  const { success, error: toastError } = useToast()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleDelete(member: Member) {
    if (!confirm(`Remove ${member.name} from the workspace?`)) return
    setLoadingId(member.id)
    try {
      await deleteUser(member.id)
      success(`${member.name} has been removed.`)
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleResend(member: Member) {
    setLoadingId(member.id)
    try {
      await resendInvite(member.id)
      success(`Invite resent to ${member.email}.`)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li key={member.id} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-[var(--primary)]">
            {member.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
              {member.name}
              {member.id === currentUserId && (
                <span className="text-xs text-[var(--text-muted)]">(you)</span>
              )}
              {member.invitePending && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  Invite pending
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {member.email} · {member.role}
            </p>
          </div>
          {isOwner && member.id !== currentUserId && member.role !== 'owner' && (
            <div className="flex items-center gap-1 shrink-0">
              {member.invitePending && (
                <button
                  onClick={() => handleResend(member)}
                  disabled={loadingId === member.id}
                  title="Resend invite"
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--border)] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(member)}
                disabled={loadingId === member.id}
                title="Remove member"
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
