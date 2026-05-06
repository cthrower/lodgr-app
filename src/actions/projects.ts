"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSlug } from "@/lib/utils";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  return user;
}

async function getAccessibleProject(
  projectId: string,
  userId: string,
  workspaceId: string,
) {
  return db.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
      OR: [{ isPrivate: false }, { createdById: userId }],
    },
  });
}

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const colour = (formData.get("colour") as string) || "#6366f1";
  const icon = (formData.get("icon") as string) || "📁";
  const isPrivate = formData.get("isPrivate") === "on";

  if (!name?.trim()) throw new Error("Name is required");

  const slug = generateSlug(name);

  const project = await db.project.create({
    data: {
      workspaceId: user.workspaceId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      colour,
      icon,
      isPrivate,
      createdById: user.id,
    },
  });

  await db.column.createMany({
    data: [
      { projectId: project.id, name: "Backlog", position: 0 },
      { projectId: project.id, name: "In Progress", position: 1 },
      { projectId: project.id, name: "In Review", position: 2 },
      { projectId: project.id, name: "Done", position: 3 },
    ],
  });

  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}

export async function archiveProject(projectId: string) {
  const user = await getCurrentUser();

  const project = await getAccessibleProject(
    projectId,
    user.id,
    user.workspaceId,
  );
  if (!project) throw new Error("Project not found");

  if (project.createdById !== user.id)
    throw new Error("Only the project owner can archive this project");

  await db.project.update({
    where: { id: projectId },
    data: { archived: true },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function restoreProject(projectId: string) {
  const user = await getCurrentUser();

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      OR: [{ isPrivate: false }, { createdById: user.id }],
    },
  });

  if (!project) throw new Error("Project not found");

  if (project.createdById !== user.id)
    throw new Error("Only the project owner can restore this project");

  await db.project.update({
    where: { id: projectId },
    data: { archived: false },
  });

  revalidatePath("/projects");
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    colour?: string;
    icon?: string;
    isPrivate?: boolean;
  },
) {
  const user = await getCurrentUser();

  const existing = await db.project.findFirst({
    where: { id: projectId, workspaceId: user.workspaceId },
  });
  if (!existing) throw new Error("Project not found");

  if (existing.createdById !== user.id)
    throw new Error("Only the project owner can update this project");

  const updateData = {
    ...data,
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.description !== undefined
      ? { description: data.description?.trim() || null }
      : {}),
  };

  const project = await db.project.update({
    where: { id: projectId },
    data: updateData,
  });

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return project;
}

export async function deleteProject(projectId: string) {
  const user = await getCurrentUser();

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: user.workspaceId },
    select: { id: true, createdById: true },
  });

  if (!project) throw new Error("Project not found");
  if (project.createdById !== user.id)
    throw new Error("Only the project owner can delete this project");

  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  revalidatePath("/", "layout");
}
