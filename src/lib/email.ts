import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Lodgr <notifications@lodgr.dev>'
const APP_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <tr>
          <td style="background:#6366f1;padding:20px 32px">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px">Lodgr</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              You received this email because you use Lodgr. Notifications are sent when tasks are assigned to you or someone comments on your tasks.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendTaskAssignedEmail({
  to,
  toName,
  taskTitle,
  assignerName,
  projectSlug,
}: {
  to: string
  toName: string
  taskTitle: string
  assignerName: string
  projectSlug: string
}) {
  if (!resend) return

  const taskUrl = `${APP_URL}/projects/${projectSlug}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${assignerName} assigned you: ${taskTitle}`,
    html: baseTemplate(`
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Hi ${toName},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#111827;font-weight:500">
        ${assignerName} assigned you a task.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:15px;color:#111827;font-weight:600">${taskTitle}</p>
      </div>
      <a href="${taskUrl}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        View task →
      </a>
    `),
  })
}

export async function sendInviteEmail({
  to,
  toName,
  workspaceName,
  tempPassword,
}: {
  to: string
  toName: string
  workspaceName: string
  tempPassword: string
}) {
  if (!resend) return

  const loginUrl = `${APP_URL}/login`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been invited to ${workspaceName} on Lodgr`,
    html: baseTemplate(`
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Hi ${toName},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#111827;font-weight:500">
        You've been invited to join <strong>${workspaceName}</strong> on Lodgr.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:500">Your login credentials</p>
        <p style="margin:0 0 4px;font-size:14px;color:#374151"><strong>Email:</strong> ${to}</p>
        <p style="margin:0;font-size:14px;color:#374151"><strong>Temporary password:</strong> ${tempPassword}</p>
      </div>
      <a href="${loginUrl}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        Sign in to Lodgr →
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af">
        You can update your display name in profile settings after signing in.
      </p>
    `),
  })
}

export async function sendPasswordChangedEmail({
  to,
  toName,
  resetToken,
}: {
  to: string
  toName: string
  resetToken: string
}) {
  if (!resend) return

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Lodgr password was changed',
    html: baseTemplate(`
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Hi ${toName},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#111827;font-weight:500">
        Your Lodgr account password was recently changed.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6">
        If you made this change, you can safely ignore this email.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:14px;color:#991b1b;font-weight:500">Didn't make this change?</p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6">
          Your account may be compromised. Reset your password immediately using the button below.
        </p>
      </div>
      <a href="${resetUrl}"
         style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        Reset my password →
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
        This reset link expires in 1 hour.
      </p>
    `),
  })
}

export async function sendCommentEmail({
  to,
  toName,
  taskTitle,
  commenterName,
  commentText,
  projectSlug,
}: {
  to: string
  toName: string
  taskTitle: string
  commenterName: string
  commentText: string
  projectSlug: string
}) {
  if (!resend) return

  const taskUrl = `${APP_URL}/projects/${projectSlug}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${commenterName} commented on "${taskTitle}"`,
    html: baseTemplate(`
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Hi ${toName},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#111827;font-weight:500">
        ${commenterName} left a comment on a task assigned to you.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:500">${taskTitle}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${commentText}</p>
      </div>
      <a href="${taskUrl}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        View task →
      </a>
    `),
  })
}
