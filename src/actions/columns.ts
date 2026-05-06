"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  return user;
}

async function ensureProjectAccess(
  projectId: string,
  userId: string,
  workspaceId: string,
) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
      archived: false,
      OR: [{ isPrivate: false }, { createdById: userId }],
    },
    select: { id: true },
  });

  if (!project) throw new Error("Project not found");
}

async function getColumnWithAccess(
  id: string,
  userId: string,
  workspaceId: string,
) {
  return db.column.findFirst({
    where: {
      id,
      project: {
        workspaceId,
        archived: false,
        OR: [{ isPrivate: false }, { createdById: userId }],
      },
    },
    select: { id: true, projectId: true },
  });
}

export async function createColumn({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const user = await getCurrentUser();
  await ensureProjectAccess(projectId, user.id, user.workspaceId);

  const last = await db.column.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const col = await db.column.create({
    data: { projectId, name: name.trim(), position: (last?.position ?? 0) + 1 },
  });

  revalidatePath("/projects");
  return col;
}

export async function updateColumn({ id, name }: { id: string; name: string }) {
  const user = await getCurrentUser();
  const column = await getColumnWithAccess(id, user.id, user.workspaceId);
  if (!column) throw new Error("Column not found");

  await db.column.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/projects");
}

export async function deleteColumn(id: string) {
  const user = await getCurrentUser();

  const col = await getColumnWithAccess(id, user.id, user.workspaceId);
  if (!col) return;

  const other = await db.column.findFirst({
    where: { projectId: col.projectId, id: { not: id } },
    orderBy: { position: "asc" },
  });

  if (other) {
    await db.task.updateMany({
      where: { columnId: id },
      data: { columnId: other.id },
    });
  }

  await db.column.delete({ where: { id } });
  revalidatePath("/projects");
}

export async function reorderColumns(
  updates: { id: string; position: number }[],
) {
  const user = await getCurrentUser();

  if (updates.length === 0) return;

  const firstColumn = await getColumnWithAccess(
    updates[0].id,
    user.id,
    user.workspaceId,
  );
  if (!firstColumn) throw new Error("Column not found");

  const validColumns = await db.column.count({
    where: {
      id: { in: updates.map((u) => u.id) },
      projectId: firstColumn.projectId,
    },
  });

  if (validColumns !== updates.length)
    throw new Error("Invalid column reorder request");

  await Promise.all(
    updates.map(({ id, position }) =>
      db.column.update({ where: { id }, data: { position } }),
    ),
  );
}
