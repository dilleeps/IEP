# AskIEP — Project Documentation Index

_Generated: 2026-02-21 | Scan: Deep | Tool: BMAD Document Project Workflow_

---

## Project Overview

- **Type:** Monorepo with 2 parts (API + UI)
- **Primary Language:** TypeScript
- **Architecture:** REST API + SPA, deployed on GCP Cloud Run
- **Purpose:** AI-powered IEP (Individualized Education Program) management platform for parents, advocates, teachers, and administrators

---

## Quick Reference

### API Part (`apps/api`)
- **Type:** Backend (Express 5 REST API)
- **Tech Stack:** TypeScript 5.9, Express 5.2, Sequelize 6 + PostgreSQL 16 + pgvector, LangChain + Gemini, JWT + Firebase Admin
- **Root:** `apps/api/`
- **Entry Point:** `src/server.ts` → `src/app.ts`
- **Dev:** `task dev:api` or `cd apps/api && npm run dev`

### UI Part (`apps/ui`)
- **Type:** Web (React SPA)
- **Tech Stack:** React 19, Vite 7, TypeScript, React Router 7, TanStack Query 5, Radix UI, Tailwind CSS 4, Firebase
- **Root:** `apps/ui/`
- **Entry Point:** `src/main.tsx`
- **Dev:** `task dev:ui` or `cd apps/ui && npm run dev`

---

## Generated Documentation

### Developer Help

- [BMAD Developer Help Guide](./help.md) — How to use BMAD agents to build features, fix bugs, add API endpoints, add UI pages, and run code reviews. **Start here if you're new to the workflow.**

### Architecture

- [Project Overview](./project-overview.md) — Purpose, tech stack, roles, key features
- [Architecture — API](./architecture-api.md) — Express module structure, routes, auth, AI pipeline
- [Architecture — UI](./architecture-ui.md) — React structure, routing, state management, design system
- [Integration Architecture](./integration-architecture.md) — UI↔API communication, external services (GCS, Gemini, Firebase, SES, Telegram)

### Database

- [Data Models — API](./data-models-api.md) — Full PostgreSQL schema (~25 tables), entity relationships, migration history

### API Reference

- [API Contracts — API](./api-contracts-api.md) — All REST endpoints, request/response formats, auth requirements

### Components & UI

- [Component Inventory — UI](./component-inventory-ui.md) — All React components, pages, domain services, design system

### File Structure

- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory tree for all parts

### Operations

- [Development Guide](./development-guide.md) — Local setup, prerequisites, running, testing, code style
- [Deployment Guide](./deployment-guide.md) — GCP Cloud Run CI/CD, GitHub Actions, infrastructure provisioning, secrets

---

## Existing Documentation

- [AGENTS.md](../AGENTS.md) — AI agent cross-cutting rules and conventions for this monorepo
- [API README](../apps/api/README.md) — API prerequisites, DB setup, demo users
- [Local Infra README](../infra/local/README.md) — Local Docker setup instructions
- [GCP Infra README](../infra/gcp/Readme.md) — GCP provisioning scripts guide
- [ADR: AI Document Analysis](./adr/0001-ai-documentanalysis.md) — Decision record for AI IEP analysis approach
- [Project Context (AI Agents)](./../_bmad-output/project-context.md) — Critical rules for AI agents working in this codebase
- [Requirements](./projectmanage/references/requirements.md) — Original product requirements
- [User Stories](./projectmanage/userstories.md) — User story backlog
- [What's Done & Pending](./projectmanage/whatsdoneandpending.md) — Project status tracker

---

## Getting Started

### First-Time Local Setup

```sh
# 1. Clone repository
git clone <repo-url> && cd iepapp

# 2. Decrypt secrets (if you have git-crypt-key)
task decrypt

# 3. Create .env file (see development-guide.md for full template)
cp .env.example .env  # edit with your values

# 4. Install dependencies
cd apps/api && npm install && cd ../..
cd apps/ui && npm install && cd ../..

# 5. Start local database + run migrations
task start:postgres

# 6. Start development servers
task dev:api   # Terminal 1 → http://localhost:3000
task dev:ui    # Terminal 2 → http://localhost:5173
```

### Key URLs (local dev)

| URL | Description |
|---|---|
| `http://localhost:5173` | Web UI (Vite dev server) |
| `http://localhost:3000` | API server |
| `http://localhost:3000/api-docs` | Swagger interactive docs |
| `http://localhost:3000/health` | API health check |

### Demo Login Credentials (after `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| Parent | parent@askiep.com | Demo123 |
| Advocate | advocate@askiep.com | Demo123 |
| Teacher | teacher@askiep.com | Demo123 |
| Admin | admin@askiep.com | Demo123 |

> Advocate and Teacher accounts require admin approval before they can log in.

---

## For AI-Assisted Development

When creating a Brownfield PRD or planning new features, start with:

1. **Full-stack feature:** Reference `architecture-api.md` + `architecture-ui.md` + `integration-architecture.md`
2. **API-only feature:** Reference `architecture-api.md` + `api-contracts-api.md` + `data-models-api.md`
3. **UI-only feature:** Reference `architecture-ui.md` + `component-inventory-ui.md`
4. **Database change:** Reference `data-models-api.md` → add migration in `apps/api/src/db/migrations/`
5. **New module:** Follow the pattern: `module.routes.ts` → `controller` → `service` → `repo` → `model` → `types` → `validation`

**Critical rules for agents:** See `_bmad-output/project-context.md` and `AGENTS.md`
