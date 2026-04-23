# Lodgr — Product Spec

**A self-hosted Notion alternative for small teams**
_lodgr.dev · Next.js · PostgreSQL · Self-hosted VPS_

---

## 1. Overview

A lightweight, self-hosted workspace app built for 1–3 users. No seat limits, no storage caps, no third-party data exposure. Where your work lives. Covers the two things Notion does best — **task/project tracking** and **docs/notes** — without the complexity of full database views, AI upsells, or subscription tiers.

---

## 2. Core Feature Set

### 2.1 Projects

- Create named projects with an optional description and colour/icon
- Each project is the top-level container for tasks and docs
- Sidebar lists all projects; active project persists in URL (`/projects/[slug]`)
- Archive a project (hidden from sidebar, recoverable)

### 2.2 Task Tracking

- Tasks belong to a project
- **Views**: Kanban board (default) and List view — toggleable per project
- **Kanban columns** are configurable per project (not hardcoded To Do / In Progress / Done)
- Each task has:
  - Title (required)
  - Description (rich text — see §2.4)
  - Status (column position)
  - Priority: None · Low · Medium · High · Urgent
  - Assignee (from workspace members)
  - Due date (optional)
  - Labels/tags (free-form, per workspace)
  - Comments (threaded, with @mentions)
  - Attachments (file upload, stored on VPS filesystem or S3-compatible)
  - Created / updated timestamps
- Tasks can be moved across columns by drag-and-drop (Kanban) or status dropdown (List)
- Filter bar: by assignee, priority, label, due date range
- Quick-add task inline in Kanban column or list

### 2.3 Docs & Notes

- Docs belong to a project (or can be "workspace-level" — unattached to a project)
- Sidebar tree: nested pages (parent → child, unlimited depth)
- Each doc has a title and rich text body
- Docs can be linked from tasks (reference a doc in a task description)
- Simple slug-based URL: `/docs/[slug]`
- No database/table blocks needed for v1 — just rich text pages

### 2.4 Rich Text Editor

Use **Tiptap** (ProseMirror-based, headless, open source).

Supported block types:

- Paragraph, H1, H2, H3
- Bullet list, Numbered list, To-do list (checkbox)
- Code block (with syntax highlighting via lowlight)
- Quote / callout block
- Horizontal rule
- Inline: bold, italic, underline, strikethrough, inline code, link
- Image embed (upload or paste)
- Mention (@user)
- `/` command menu (slash commands to insert block types)

No need to build a custom editor — Tiptap handles this well and integrates cleanly with Next.js.

### 2.5 Users & Auth

- Small fixed user set (invite-only, no public signup)
- Auth via **NextAuth.js** (credentials provider — email + password, bcrypt hashed)
- Optional: magic link via email (Resend) — useful since you already use Resend for Wobble
- Roles: **Owner** (you) and **Member** (collaborators)
- Owner can invite members, deactivate accounts, manage workspace settings
- Session stored in a `sessions` table (database adapter)

### 2.6 Notifications (v1 — lightweight)

- In-app notification bell: task assigned to you, @mention in comment or doc
- Notifications stored in DB, marked read/unread
- Email notification (Resend) for @mentions and assignments — optional per-user preference

### 2.7 Search

- Full-text search across task titles, task descriptions, and doc content
- Use PostgreSQL `tsvector` + `tsquery` — no Elasticsearch needed at this scale
- Keyboard shortcut (`Cmd+K`) opens a command palette with search + quick navigation

---

## 3. Data Model

### `workspaces`

| Column     | Type        | Notes |
| ---------- | ----------- | ----- |
| id         | uuid PK     |       |
| name       | text        |       |
| slug       | text unique |       |
| created_at | timestamptz |       |

### `users`

| Column        | Type                | Notes        |
| ------------- | ------------------- | ------------ |
| id            | uuid PK             |              |
| workspace_id  | uuid FK             |              |
| email         | text unique         |              |
| name          | text                |              |
| password_hash | text                |              |
| role          | enum: owner, member |              |
| avatar_url    | text                | nullable     |
| active        | boolean             | default true |
| created_at    | timestamptz         |              |

### `projects`

| Column       | Type            | Notes             |
| ------------ | --------------- | ----------------- |
| id           | uuid PK         |                   |
| workspace_id | uuid FK         |                   |
| name         | text            |                   |
| slug         | text unique     |                   |
| description  | text            | nullable          |
| colour       | text            | hex               |
| icon         | text            | emoji or icon key |
| archived     | boolean         | default false     |
| created_by   | uuid FK → users |                   |
| created_at   | timestamptz     |                   |

### `columns` _(Kanban columns per project)_

| Column     | Type    | Notes                       |
| ---------- | ------- | --------------------------- |
| id         | uuid PK |                             |
| project_id | uuid FK |                             |
| name       | text    | e.g. "Backlog", "In Review" |
| position   | integer | for ordering                |
| colour     | text    | optional                    |

### `tasks`

| Column      | Type                                  | Notes                      |
| ----------- | ------------------------------------- | -------------------------- |
| id          | uuid PK                               |                            |
| project_id  | uuid FK                               |                            |
| column_id   | uuid FK                               |                            |
| title       | text                                  |                            |
| description | jsonb                                 | Tiptap JSON                |
| priority    | enum: none, low, medium, high, urgent |                            |
| assignee_id | uuid FK → users                       | nullable                   |
| due_date    | date                                  | nullable                   |
| position    | float                                 | for ordering within column |
| created_by  | uuid FK → users                       |                            |
| created_at  | timestamptz                           |                            |
| updated_at  | timestamptz                           |                            |

### `task_labels`

| Column       | Type    | Notes |
| ------------ | ------- | ----- |
| id           | uuid PK |       |
| workspace_id | uuid FK |       |
| name         | text    |       |
| colour       | text    |       |

### `task_label_assignments`

| Column   | Type    | Notes |
| -------- | ------- | ----- |
| task_id  | uuid FK |       |
| label_id | uuid FK |       |

### `task_comments`

| Column     | Type            | Notes       |
| ---------- | --------------- | ----------- |
| id         | uuid PK         |             |
| task_id    | uuid FK         |             |
| author_id  | uuid FK → users |             |
| body       | jsonb           | Tiptap JSON |
| created_at | timestamptz     |             |
| updated_at | timestamptz     |             |

### `docs`

| Column       | Type            | Notes                           |
| ------------ | --------------- | ------------------------------- |
| id           | uuid PK         |                                 |
| workspace_id | uuid FK         |                                 |
| project_id   | uuid FK         | nullable (workspace-level docs) |
| parent_id    | uuid FK → docs  | nullable (for nesting)          |
| title        | text            |                                 |
| slug         | text unique     |                                 |
| body         | jsonb           | Tiptap JSON                     |
| position     | float           | for sibling ordering            |
| created_by   | uuid FK → users |                                 |
| created_at   | timestamptz     |                                 |
| updated_at   | timestamptz     |                                 |

### `notifications`

| Column      | Type                                 | Notes         |
| ----------- | ------------------------------------ | ------------- |
| id          | uuid PK                              |               |
| user_id     | uuid FK                              | recipient     |
| type        | enum: assigned, mentioned, commented |               |
| entity_type | enum: task, doc, comment             |               |
| entity_id   | uuid                                 |               |
| read        | boolean                              | default false |
| created_at  | timestamptz                          |               |

### `attachments`

| Column       | Type            | Notes                 |
| ------------ | --------------- | --------------------- |
| id           | uuid PK         |                       |
| task_id      | uuid FK         |                       |
| uploaded_by  | uuid FK → users |                       |
| filename     | text            |                       |
| storage_path | text            | server path or S3 key |
| mime_type    | text            |                       |
| size_bytes   | integer         |                       |
| created_at   | timestamptz     |                       |

---

## 4. Architecture

```
┌─────────────────────────────────────────────┐
│              Browser Client                  │
│  Next.js App Router (RSC + Client Components)│
└─────────────┬───────────────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────────────┐
│           Next.js Server (VPS)               │
│  - API Routes (App Router route handlers)    │
│  - Server Actions for mutations              │
│  - NextAuth session management               │
│  - File upload handling                      │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│            PostgreSQL (same VPS)             │
│  - Prisma ORM (type-safe client, schema migrations)  │
└─────────────────────────────────────────────┘
```

**Key decisions:**

- **Prisma ORM** — schema-first, excellent Next.js integration, type-safe client, and `prisma migrate dev` handles the full migration workflow cleanly.
- **Server Actions** for mutations (create task, move card, update doc) — keeps the client thin
- **React Query (TanStack Query)** on the client for optimistic updates on Kanban drag-and-drop
- **Real-time** (v2): Add WebSocket support via `socket.io` or Supabase Realtime if you want live collaboration. For v1, periodic polling or manual refresh is acceptable.

---

## 5. Tech Stack

| Layer        | Choice                                         | Why                                              |
| ------------ | ---------------------------------------------- | ------------------------------------------------ |
| Framework    | Next.js 15 (App Router)                        | Your stack                                       |
| Language     | TypeScript                                     | Type safety throughout                           |
| ORM          | Prisma                                         | Schema-first, great Next.js DX, type-safe client |
| Database     | PostgreSQL 16                                  | Your stack                                       |
| Auth         | NextAuth v5 (Auth.js)                          | Credentials + magic link                         |
| Editor       | Tiptap                                         | Best open-source rich text                       |
| Drag & drop  | `@dnd-kit/core`                                | Accessible, works well with React                |
| Styling      | Tailwind CSS + CSS variables                   | Fast, consistent                                 |
| Email        | Resend                                         | Already using it                                 |
| File storage | Local VPS filesystem (v1) / Cloudflare R2 (v2) | Simple to start                                  |
| Search       | PostgreSQL full-text                           | No extra service                                 |
| Deployment   | PM2 + Nginx on VPS                             | Self-hosted                                      |

---

## 6. URL Structure

```
/                          → redirect to /projects
/login                     → auth
/projects                  → project list
/projects/[slug]           → project kanban (default view)
/projects/[slug]/list      → project list view
/projects/[slug]/docs      → project docs tree
/docs/[slug]               → individual doc page
/settings                  → workspace settings (members, labels)
/settings/profile          → user profile
```

---

## 7. UI / UX Principles

- **Sidebar** (fixed left): workspace name + avatar, project list, workspace docs, settings link
- **Main content area**: fills remaining width
- **Top bar** (per project): view toggles, filter bar, quick-add task button
- Dark mode support via CSS variables (toggle in user preferences)
- Keyboard shortcuts: `Cmd+K` search, `N` new task (when board focused), `E` edit task
- Mobile: responsive but optimised for desktop — this is a productivity tool

---

## 8. Phased Build Plan

### Phase 1 — Foundation (Week 1–2)

- [ ] Next.js project scaffolding, Prisma schema, DB migrations (`prisma migrate dev`)
- [ ] Auth (NextAuth credentials) — login, session, middleware protection
- [ ] Workspace, users, invite flow
- [ ] Projects CRUD + sidebar

### Phase 2 — Tasks (Week 3–4)

- [ ] Kanban board with configurable columns
- [ ] Drag-and-drop (dnd-kit)
- [ ] Task detail modal (title, description, priority, assignee, due date)
- [ ] List view
- [ ] Labels + filter bar

### Phase 3 — Docs (Week 5)

- [ ] Tiptap editor integration
- [ ] Doc tree (nested pages) with drag-to-reorder
- [ ] `/` slash commands
- [ ] Doc ↔ task cross-linking

### Phase 4 — Collaboration & Polish (Week 6)

- [ ] Comments on tasks with @mentions
- [ ] In-app notifications
- [ ] Full-text search (`Cmd+K` palette)
- [ ] File attachments on tasks
- [ ] Email notifications (Resend)

### Phase 5 — Deployment

- [ ] Dockerise app + PostgreSQL
- [ ] Nginx reverse proxy + SSL (Certbot)
- [ ] PM2 or Docker Compose process management
- [ ] Automated daily `pg_dump` backup to remote storage
- [ ] Environment config (`.env.production`)

---

## 9. Out of Scope (v1)

These are deliberate cuts to keep scope tight:

- Database/table views (Notion's killer feature — not needed here)
- Public sharing / guest access
- Real-time multiplayer editing
- Mobile app
- AI features
- Billing / subscription
- Webhooks / integrations

Real-time collaboration (WebSocket-based) is the most likely v2 addition once the core is stable.

---

## 10. Deployment Notes

**Recommended VPS setup:**

- Ubuntu 24.04 LTS
- 2 vCPU / 4GB RAM minimum (plenty for 1–3 users)
- Docker Compose: `app` container + `postgres` container + `nginx` container
- Certbot for SSL on your chosen domain
- Daily `pg_dump` cron to Cloudflare R2 or Backblaze B2

**Docker Compose services:**

```yaml
services:
  app: # Next.js (standalone build)
  postgres: # PostgreSQL 16
  nginx: # Reverse proxy + SSL termination
```

The Next.js standalone build output keeps the Docker image lean (~150MB).

---

## 11. Rough Effort Estimate

| Phase                   | Effort                      |
| ----------------------- | --------------------------- |
| Phase 1 (foundation)    | ~3–4 days                   |
| Phase 2 (tasks)         | ~5–7 days                   |
| Phase 3 (docs)          | ~3–4 days                   |
| Phase 4 (collaboration) | ~4–5 days                   |
| Phase 5 (deployment)    | ~1–2 days                   |
| **Total**               | **~16–22 days** (part-time) |

Realistically 6–8 weeks building around other commitments. Phase 1–2 alone gives you a usable task tracker in ~2 weeks.

---

_Generated April 2026 · Lodgr Spec v1.0 · lodgr.dev_
