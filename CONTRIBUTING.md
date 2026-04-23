# Contributing to Lodgr

Thanks for taking the time to contribute. Lodgr is a self-hosted workspace tool built for people who want to own their own data, and every contribution helps make it better for everyone who self-hosts it.

Please read this before opening a PR. It will save you time and make the review process much smoother.

---

## Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Branch Strategy](#branch-strategy)
- [Development Workflow](#development-workflow)
- [Commit Style](#commit-style)
- [Pull Request Guidelines](#pull-request-guidelines)
- [AI Code Review](#ai-code-review)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm 9+

### Local setup

```bash
# Clone the repo
git clone https://github.com/lodgr-dev/lodgr.git
cd lodgr

# Install dependencies
pnpm install

# Copy the environment file and fill in your values
cp .env.example .env.local

# Set up the database
pnpm db:migrate

# Seed with a default workspace and user
pnpm db:seed

# Start the dev server
pnpm dev
```

The app will be running at `http://localhost:3000`.

Your seed credentials will be printed to the terminal after `pnpm db:seed`.

---

## How to Contribute

There are a few ways to contribute:

- Fix a bug listed in the [issues](https://github.com/lodgr-dev/lodgr/issues)
- Build a feature from the [roadmap](https://github.com/lodgr-dev/lodgr/issues?q=label%3Aroadmap)
- Improve documentation
- Report a bug or suggest a feature

If you want to work on something significant, open an issue first and describe what you are planning. That way we can discuss it before you spend time on it, and avoid duplicated effort.

---

## Branch Strategy

We use two long-lived branches:

- `main` is production-ready at all times. Direct pushes are blocked.
- `dev` is the integration branch. All PRs target `dev`, not `main`.

Create your feature branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

Branch naming conventions:

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Maintenance, deps, config |
| `refactor/` | Code changes with no behaviour change |

---

## Development Workflow

1. Create a branch from `dev` using the naming conventions above
2. Make your changes in small, focused commits
3. Run the full check suite before pushing:

```bash
pnpm typecheck
pnpm lint
pnpm db:validate
pnpm build
```

4. Push your branch and open a PR against `dev`

---

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add drag and drop for kanban columns
fix: resolve session expiry on mobile
docs: update local setup instructions
chore: bump next to 15.3.0
```

Keep commits focused. One logical change per commit makes review and rollback much easier.

---

## Pull Request Guidelines

- PRs should be focused on one thing. If you are fixing a bug and noticed another issue, open a separate PR.
- Fill out the PR template fully. Reviewers will ask you to complete it if you skip sections.
- Link to the relevant issue if one exists.
- Add screenshots or a short screen recording for any UI changes.
- Keep PRs as small as reasonably possible. Large PRs take much longer to review and are more likely to introduce bugs.

---

## AI Code Review

All PRs are automatically reviewed by Claude via GitHub Actions. The bot will leave inline comments on the PR within a few minutes of it being opened.

A few things worth knowing:

- The AI review happens before any human reviews it. Read the feedback before requesting a human review.
- Address or respond to every comment the bot leaves, even if you disagree. If you think a comment is wrong, explain why and we can discuss it.
- The AI review is a first pass, not a final verdict. Human review is still required before merge.
- The bot reviews for correctness, security, performance, and code style. It will not approve or merge PRs.

---

## Code Style

- TypeScript throughout, no `any` unless absolutely necessary and commented
- Tailwind for styling, no inline styles
- Server Actions for mutations, API routes for anything that needs to be called externally
- Prisma for all database access, no raw SQL 
- Components go in `src/components`, server actions in `src/actions`, types in `src/types`

ESLint and Prettier are configured in the repo. Run `pnpm lint:fix` to auto-fix formatting issues.

---

## Reporting Bugs

Use the [bug report template](https://github.com/lodgr-dev/lodgr/issues/new?template=bug_report.md).

Please include your Node version, PostgreSQL version, and how you are running Lodgr (Docker, bare VPS, local dev). Without that information it is very hard to reproduce issues.

---

## Suggesting Features

Use the [feature request template](https://github.com/lodgr-dev/lodgr/issues/new?template=feature_request.md).

We are trying to keep Lodgr focused and self-hostable. Feature suggestions that add external service dependencies or significantly increase operational complexity are unlikely to be accepted in core, but could work well as plugins or integrations down the line.

---

## Questions

Open a [GitHub Discussion](https://github.com/lodgr-dev/lodgr/discussions) rather than an issue for general questions. Issues are for bugs and tracked feature work.