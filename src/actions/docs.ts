"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSlug } from "@/lib/utils";

export async function createDoc({
  title = "Untitled",
  projectId,
  parentId,
}: {
  title?: string;
  projectId?: string;
  parentId?: string;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  if (projectId) {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: user.workspaceId,
        OR: [{ isPrivate: false }, { createdById: user.id }],
      },
      select: { id: true },
    });
    if (!project) throw new Error("Project not found");
  }

  const slug = generateSlug(title);

  const doc = await db.doc.create({
    data: {
      workspaceId: user.workspaceId,
      projectId: projectId ?? null,
      parentId: parentId ?? null,
      title: title.trim(),
      slug,
      createdById: user.id,
    },
  });

  revalidatePath("/docs");
  if (projectId) revalidatePath("/projects");
  redirect(`/docs/${doc.slug}`);
}

export async function updateDoc({
  id,
  title,
  body,
}: {
  id: string;
  title?: string;
  body?: unknown;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const existing = await db.doc.findFirst({
    where: {
      id,
      workspaceId: user.workspaceId,
      OR: [
        { projectId: null },
        { project: { isPrivate: false } },
        { project: { createdById: user.id } },
      ],
    },
    select: { id: true },
  });
  if (!existing) throw new Error("Document not found");

  const doc = await db.doc.update({
    where: { id: existing.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body !== undefined ? { body: body as object } : {}),
    },
  });

  revalidatePath(`/docs/${doc.slug}`);
  return doc;
}

export async function deleteDoc(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const doc = await db.doc.findFirst({
    where: {
      id,
      workspaceId: user.workspaceId,
      OR: [
        { projectId: null },
        { project: { isPrivate: false } },
        { project: { createdById: user.id } },
      ],
    },
    select: { id: true },
  });
  if (!doc) throw new Error("Document not found");

  await db.doc.delete({ where: { id: doc.id } });
  revalidatePath("/docs");
  redirect("/docs");
}

export async function createChildDoc({
  parentId,
  projectId,
}: {
  parentId: string;
  projectId?: string;
}) {
  return createDoc({ title: "Untitled", parentId, projectId });
}
