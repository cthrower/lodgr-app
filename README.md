# Lodgr

**Where your work lives.**

A lightweight, self-hosted workspace app for small teams. Covers the two things Notion does best — **task tracking** and **docs** — without the complexity, AI upsells, or subscription tiers.

Built to run on your own VPS. Your data stays yours.

![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## Features

**Projects & Tasks**
- Kanban board with configurable columns — create, rename, reorder by drag
- Drag-and-drop tasks within and across columns
- List view per project
- Task detail: title, rich-text description, priority, assignee, due date, labels
- Threaded comments with `@mention` notifications
- File attachments (local filesystem, up to 50 MB)
- Filter bar: priority, assignee, label, due date

**Docs**
- Workspace-level and project-level docs
- Nested pages (unlimited depth)
- Rich text via [Tiptap](https://tiptap.dev): headings, lists, to-do lists, code blocks with syntax highlighting, blockquotes, images, inline formatting, and a `/` slash-command menu

**Workspace**
- Invite-only — no public sign-up
- Owner and Member roles
- In-app notification bell (assignments, mentions, comments)
- Full-text search across tasks and docs (`Cmd+K`)
- Dark mode toggle

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials) |
| Editor | Tiptap (ProseMirror) |
| Drag & drop | @dnd-kit |
| Styling | Tailwind CSS v4 + CSS variables |
| Email | Resend |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- A [Resend](https://resend.com) API key (for email notifications)

### 1. Clone and install

```bash
git clone https://github.com/cthrower/lodgr-app.git
cd lodgr-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lodgr"
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
RESEND_FROM="Lodgr <noreply@yourdomain.com>"
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Seed the workspace

Create your workspace and owner account:

```bash
npx prisma db seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Self-Hosting (Production)

### Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://lodgr:password@postgres:5432/lodgr
      NEXTAUTH_SECRET: your-secret
      NEXTAUTH_URL: https://yourdomain.com
      RESEND_API_KEY: re_...
      RESEND_FROM: Lodgr <noreply@yourdomain.com>
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lodgr
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lodgr
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker compose up -d
docker compose exec app npx prisma db push
```

### Nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Use [Certbot](https://certbot.eff.org) for SSL.

### Recommended VPS spec

Ubuntu 24.04 LTS · 2 vCPU · 4 GB RAM — plenty for 1–10 users.

---

## URL Structure

```
/                        → redirect to /projects
/login                   → sign in
/projects                → project list
/projects/[slug]         → kanban board
/projects/[slug]/list    → list view
/projects/[slug]/docs    → project docs
/docs/[slug]             → individual doc
/settings                → workspace (members, labels)
/settings/profile        → user profile
```

---

## Development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # ESLint
npx prisma studio  # visual database browser
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Open search / command palette |
| `N` | New task (when board focused) |
| `E` | Edit task |
| `Escape` | Close modal / cancel |

---

## Roadmap

- [ ] WebSocket real-time collaboration
- [ ] Mobile-optimised layout
- [ ] S3-compatible file storage (Cloudflare R2)
- [ ] Magic link authentication
- [ ] Doc ↔ task cross-linking

---

## License

MIT
