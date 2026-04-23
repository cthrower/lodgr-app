'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
}
