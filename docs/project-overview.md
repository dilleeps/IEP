# AskIEP — Project Overview

_Generated: 2026-02-21 | Scan: Deep | Repository Type: Monorepo_

---

## Executive Summary

**AskIEP** is an AI-powered IEP (Individualized Education Program) management platform designed to help parents, advocates, teachers, and administrators navigate the complex US special-education system. The platform provides tools for:

- Uploading and AI-analyzing IEP documents (PDF extraction + Gemini analysis)
- Tracking child goals, services, behavior patterns, and compliance
- Generating AI-assisted advocacy letters and legal support
- Maintaining a secure contact/communication log
- Administering user accounts and approvals

The project is structured as a **monorepo** with two main applications: a TypeScript/Express REST API backend and a React/Vite SPA frontend, deployed on **Google Cloud Platform (Cloud Run)**.

---

## Repository Structure

| Layer | Path | Type | Description |
|---|---|---|---|
| **API** | `apps/api/` | backend | Express 5 REST API, TypeScript, Sequelize ORM, PostgreSQL+pgvector |
| **UI** | `apps/ui/` | web | React 19 SPA, Vite 7, React Query, Radix UI, Tailwind CSS 4 |
| **Infrastructure** | `infra/` | infra | GCP scripts, local Docker dev, GitHub Actions helpers, Telegram |
| **Deploy** | `deploy/` | ops | Shell scripts for Cloud Run deployment |
| **Documentation** | `docs/` | docs | Architecture docs, ADRs, project management |
| **BMAD tooling** | `_bmad/` | tooling | AI-assisted development workflow engine |

---

## Tech Stack Summary

### Backend API (`apps/api`)
| Category | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.9.3 |
| Runtime | Node.js | 18+ |
| Framework | Express | 5.2.1 |
| ORM | Sequelize | 6.37.7 |
| Database | PostgreSQL + pgvector | 16 |
| Auth | JWT + Firebase Admin | — |
| AI | LangChain + @google/genai | ^1.2.6 / ^1.34.0 |
| Validation | Zod | 4.3.5 |
| Logging | Winston + express-winston | — |
| Observability | OpenTelemetry SDK | 0.208.0 |
| Testing | Vitest + testcontainers + supertest | 3.2.4 |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) | — |
| File Storage | Google Cloud Storage | ^7.18.0 |
| Email | Nodemailer (SMTP/SES) | ^7.0.12 |

### Frontend UI (`apps/ui`)
| Category | Technology | Version |
|---|---|---|
| Language | TypeScript | ~5.9.3 |
| Framework | React | 19.2.0 |
| Build | Vite | 7.2.4 |
| Routing | React Router | 7.11.0 |
| Data Fetching | React Query (TanStack) | 5.90.19 |
| UI Library | Radix UI (suite) | — |
| Styling | Tailwind CSS | 4.1.18 |
| Auth | Firebase (client SDK) | ^11.0.1 |
| Icons | Lucide React | ^0.562.0 |
| Offline | IDB (IndexedDB) | ^8.0.3 |

---

## User Roles & Access Model

| Role | Registration | Approval | Access |
|---|---|---|---|
| **PARENT** | Self-register | Auto-approved | Full app access for their children |
| **ADVOCATE** | Self-register | Admin approval required | App access once approved |
| **TEACHER** | Self-register | Admin approval required | App access once approved |
| **ADMIN** | Admin-created | N/A | Full admin + user management |

---

## Architecture Type

**Pattern**: Multi-tier REST API + SPA
**Deployment**: Containerized (Docker) on GCP Cloud Run
**Database**: Cloud SQL (PostgreSQL 16) with pgvector extension for AI embeddings
**Storage**: Google Cloud Storage for IEP document files
**CI/CD**: GitHub Actions (manual dispatch + workflow_call) → GCP Artifact Registry → Cloud Run

---

## Key Features

1. **IEP Document Analysis** — Upload PDF IEPs; AI extracts goals, accommodations, red flags, risk scores via Gemini
2. **Goal Progress Tracking** — Track per-child IEP goals with baseline/target/current values
3. **Behavior ABC Logging** — Antecedent-Behavior-Consequence entries with pattern analysis
4. **Compliance Monitoring** — Track service delivery compliance with minutes provided vs. required
5. **Contact Log** — Communication history with school personnel, follow-up tracking
6. **AI Advocacy Lab** — Conversational AI sessions for IEP advocacy guidance
7. **Letter Writer** — AI-generated advocacy and request letters
8. **Legal Support Agent** — AI agent for special education legal questions (IDEA, etc.)
9. **Smart Prompts** — Role-aware contextual prompts for parents/advocates/teachers
10. **Vector Search** — pgvector-powered semantic search across IEP content

---

## Getting Started

See [Development Guide](./development-guide.md) for full setup instructions.

**Quick start (local):**
```sh
# 1. Start local database
task start:postgres

# 2. Start API
task dev:api

# 3. Start UI (separate terminal)
task dev:ui
```

API docs available at `http://localhost:3000/api-docs` once the API is running.
