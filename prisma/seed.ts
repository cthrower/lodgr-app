import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Create workspace
  const workspace = await db.workspace.upsert({
    where: { slug: 'my-workspace' },
    update: {},
    create: {
      name: 'My Workspace',
      slug: 'my-workspace',
    },
  })

  // Create owner user
  const passwordHash = await bcrypt.hash('password', 12)
  const user = await db.user.upsert({
    where: { email: 'email@yourdomain.com' },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: 'email@yourdomain.com',
      name: 'Firstname',
      passwordHash,
      role: 'owner',
    },
  })

  // Create a sample project
  const project = await db.project.upsert({
    where: { slug: 'lodgr-dev' },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Lodgr Dev',
      slug: 'lodgr-dev',
      description: 'Building the app',
      colour: '#6366f1',
      icon: '🚀',
      createdById: user.id,
    },
  })

  // Create default columns
  const columnData = [
    { name: 'Backlog', position: 0 },
    { name: 'In Progress', position: 1 },
    { name: 'In Review', position: 2 },
    { name: 'Done', position: 3 },
  ]

  for (const col of columnData) {
    await db.column.upsert({
      where: {
        id: `${project.id}-${col.position}`,
      },
      update: {},
      create: {
        id: `${project.id}-${col.position}`,
        projectId: project.id,
        name: col.name,
        position: col.position,
      },
    })
  }

  console.log('Seed complete')
  console.log(`  Workspace: ${workspace.name} (${workspace.slug})`)
  console.log(`  User: ${user.email} / password`)
  console.log(`  Project: ${project.name}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
