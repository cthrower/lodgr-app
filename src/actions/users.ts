'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sendInviteEmail, sendPasswordChangedEmail } from '@/lib/email'

export async function inviteUser(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true, role: true, workspace: { select: { name: true } } },
  })
  if (!currentUser || currentUser.role !== 'owner') throw new Error('Only owners can invite members')

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email required')

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) throw new Error('A user with this email already exists')

  const tempPassword = randomBytes(6).toString('hex')
  const passwordHash = await hash(tempPassword, 12)
  const name = email.split('@')[0]

  const newUser = await db.user.create({
    data: {
      workspaceId: currentUser.workspaceId,
      email,
      name,
      passwordHash,
      role: 'member',
    },
    select: { id: true, email: true, name: true },
  })

  try {
    await sendInviteEmail({
      to: email,
      toName: name,
      workspaceName: currentUser.workspace.name,
      tempPassword,
    })
  } catch {
    // email failure must not break the action
  }

  revalidatePath('/settings')
  return newUser
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) throw new Error('All fields are required')
  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters')
  if (newPassword !== confirmPassword) throw new Error('Passwords do not match')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, passwordHash: true },
  })
  if (!user || !user.passwordHash) throw new Error('User not found')

  const valid = await compare(currentPassword, user.passwordHash)
  if (!valid) throw new Error('Current password is incorrect')

  const newHash = await hash(newPassword, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  })

  const resetToken = randomBytes(32).toString('hex')
  await db.user.update({
    where: { id: session.user.id },
    data: { resetToken, resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60) },
  })

  try {
    await sendPasswordChangedEmail({ to: user.email, toName: user.name, resetToken })
  } catch {
    // email failure must not break the action
  }
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('Name is required')

  await db.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  })

  revalidatePath('/settings/profile')
}
