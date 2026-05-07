"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendCommentEmail } from "@/lib/email";

function extractText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  if (typeof b.text === "string") return b.text;
  if (b.type === "doc" && Array.isArray(b.content)) {
    return b.content
      .map((node: Record<string, unknown>) =>
        Array.isArray(node.content)
          ? (node.content as Record<string, unknown>[])
              .map((l) => l.text ?? "")
              .join("")
          : "",
      )
      .join(" ");
  }
  return "";
}

export async function createComment({
  taskId,
  body,
  parentId,
}: {
  taskId: string;
  body: unknown;
  parentId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const canAccessTask = await db.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspaceId: user.workspaceId,
        archived: false,
        OR: [{ isPrivate: false }, { createdById: user.id }],
      },
    },
    select: { id: true },
  });
  if (!canAccessTask) throw new Error("Task not found");

  const comment = await db.taskComment.create({
    data: {
      taskId,
      authorId: user.id,
      body: body as object,
      ...(parentId ? { parentId } : {}),
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      project: {
        select: {
          slug: true,
          workspace: {
            include: {
              users: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!task) return comment;

  // Notify assignee (if not the commenter)
  if (task.assigneeId && task.assigneeId !== user.id) {
    await db.notification.create({
      data: {
        userId: task.assigneeId,
        type: "commented",
        entityType: "comment",
        entityId: comment.id,
      },
    });

    try {
      const commentText = extractText(body);
      if (task.assignee) {
        await sendCommentEmail({
          to: task.assignee.email,
          toName: task.assignee.name,
          taskTitle: task.title,
          commenterName: user.name,
          commentText,
          projectSlug: task.project.slug,
        });
      }
    } catch {
      // email failure must not break the action
    }
  }

  // Parse @mentions and notify mentioned users
  const text = extractText(body);
  const mentionTokens = [...text.matchAll(/@(\w+)/g)].map((m) =>
    m[1].toLowerCase(),
  );

  if (mentionTokens.length > 0) {
    const workspaceUsers = task.project.workspace.users;
    const alreadyNotified = new Set<string>([user.id, task.assigneeId ?? ""]);

    for (const token of mentionTokens) {
      const matched = workspaceUsers.find(
        (u: { id: string; name: string; email: string }) =>
          u.name.toLowerCase().startsWith(token) ||
          u.name.toLowerCase().replace(/\s+/g, "") === token,
      );
      if (matched && !alreadyNotified.has(matched.id)) {
        alreadyNotified.add(matched.id);
        await db.notification.create({
          data: {
            userId: matched.id,
            type: "mentioned",
            entityType: "comment",
            entityId: comment.id,
          },
        });
      }
    }
  }

  return comment;
}

export async function deleteComment(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const comment = await db.taskComment.findFirst({
    where: {
      id,
      task: {
        project: {
          workspaceId: user.workspaceId,
          OR: [{ isPrivate: false }, { createdById: user.id }],
        },
      },
    },
    select: { id: true, authorId: true },
  });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== user.id)
    throw new Error("Only comment authors can delete comments");

  await db.taskComment.delete({ where: { id: comment.id } });
}
