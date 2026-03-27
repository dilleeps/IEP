# BMAD Developer Help Guide — AskIEP

_How to use the BMAD AI-assisted development workflow for common tasks_

---

## What is BMAD?

BMAD is a structured AI-agent workflow engine built into this project. It provides specialist agents (Analyst, PM, Architect, Developer, QA) that guide you through planning, designing, and implementing changes with full project context.

**How to invoke any agent:**
```
/bmad-agent-bmm-<agent-name>
```

At any time, type `/bmad-help <question>` inside an agent to get guidance on what to do next.

---

## Available Agents

| Command | Agent | Role |
|---|---|---|
| `/bmad-agent-bmm-analyst` | Mary (Analyst) | Research, brief creation, project documentation |
| `/bmad-agent-bmm-pm` | PM | PRD creation, epics and stories |
| `/bmad-agent-bmm-architect` | Architect | Technical architecture documents |
| `/bmad-agent-bmm-dev` | Developer | Write code for a story |
| `/bmad-agent-bmm-qa` | QA Engineer | Generate automated tests |
| `/bmad-agent-bmm-sm` | Scrum Master | Sprint/story management |
| `/bmad-agent-bmm-quick-flow-solo-dev` | Solo Dev | Fast spec + implement (no full PRD needed) |
| `/bmad-agent-bmm-ux-designer` | UX Designer | UX/UI design specs |
| `/bmad-agent-bmm-tech-writer` | Tech Writer | Documentation |

---

## Common Tasks

---

### 1. Build a New Feature (Full Flow)

Use this when the feature is significant — new screen, new API module, cross-cutting change.

**Step 1 — Write the PRD**
```
/bmad-agent-bmm-pm → [CP] Create PRD
```
- Reference: `docs/project-overview.md`, `docs/architecture-api.md`, `docs/architecture-ui.md`
- Output: `_bmad-output/planning-artifacts/prd.md`

**Step 2 — Create Architecture (if needed)**
```
/bmad-agent-bmm-architect → [CA] Create Architecture
```
- Reference: `docs/architecture-api.md`, `docs/integration-architecture.md`, `docs/data-models-api.md`
- Output: `_bmad-output/planning-artifacts/architecture.md`

**Step 3 — Create Epics & Stories**
```
/bmad-agent-bmm-pm → [CE] Create Epics and Stories
```
- Input: PRD from Step 1 + Architecture from Step 2
- Output: `_bmad-output/planning-artifacts/epics/`

**Step 4 — Check Implementation Readiness**
```
/bmad-agent-bmm-pm → [IR] Implementation Readiness
```
Validates that PRD + Architecture + Stories are all aligned before coding starts.

**Step 5 — Implement Story by Story**
```
/bmad-agent-bmm-dev → [DS] Dev Story
```
- Reference: `docs/architecture-api.md` (for API patterns), `docs/architecture-ui.md` (for UI patterns)
- Reference: `_bmad-output/project-context.md` (critical agent rules)
- The agent writes tests + code for one story at a time

**Step 6 — Generate Tests**
```
/bmad-agent-bmm-qa → [QA] Automate
```
- Reference: `docs/api-contracts-api.md` (for API tests)
- Output: test files alongside the implemented code

---

### 2. Build a Small/Quick Feature (Solo Dev Fast Flow)

Use this for smaller additions where a full PRD process is overkill.

**Step 1 — Quick Spec**
```
/bmad-agent-bmm-quick-flow-solo-dev → [QS] Quick Spec
```
- Produces a concise technical spec + implementation-ready stories
- Reference: `docs/source-tree-analysis.md` to know where to add code
- Reference: `docs/api-contracts-api.md` to understand existing API patterns

**Step 2 — Implement**
```
/bmad-agent-bmm-quick-flow-solo-dev → [QD] Quick-flow Develop
```
- Implements the story end-to-end based on the Quick Spec

---

### 3. Fix a Bug

BMAD doesn't have a dedicated "bug fix" workflow, but here's the best approach:

**Option A — Small bug (1-2 files):** Work directly with the Dev agent in chat mode:
```
/bmad-agent-bmm-dev → [CH] Chat
```
Describe the bug. Reference the relevant docs below based on where the bug is.

**Option B — Complex bug (multi-file or systemic):** Use Quick Flow:
```
/bmad-agent-bmm-quick-flow-solo-dev → [QS] Quick Spec
```
Describe the bug as a "fix story" → then implement with `[QD]`.

**Option C — Mid-implementation discovered issue:**
```
/bmad-agent-bmm-pm → [CC] Course Correction
```
Use this when a bug reveals a design/architecture problem that requires re-planning.

**What to reference when fixing a bug:**

| Bug Area | Reference Document |
|---|---|
| API route/controller | `docs/api-contracts-api.md` |
| Database query / model | `docs/data-models-api.md` |
| Auth / permissions | `docs/architecture-api.md` → Auth section |
| UI component | `docs/component-inventory-ui.md` |
| UI routing | `docs/architecture-ui.md` → Routing section |
| API↔UI integration | `docs/integration-architecture.md` |
| Environment/config | `docs/development-guide.md` |
| Deployment issue | `docs/deployment-guide.md` |

---

### 4. Add a New API Endpoint

**Quick reference — existing pattern to follow:**
```
apps/api/src/modules/<domain>/
├── <domain>.routes.ts      # Add your route here
├── <domain>.controller.ts  # Add handler
├── <domain>.service.ts     # Add business logic
├── <domain>.repo.ts        # Add DB query
├── <domain>.validation.ts  # Add Zod schema
└── <domain>.types.ts       # Add TypeScript types
```

**Key rules (from `AGENTS.md` + `_bmad-output/project-context.md`):**
- Always apply `authenticate` middleware on protected routes
- Use `validateBody(zodSchema)` middleware — never validate in the controller
- Raise `AppError(message, statusCode, code)` for expected errors
- All local imports need `.js` extension (NodeNext ESM)
- Use `BaseRepo` for database access
- Controllers convert dates to ISO strings before responding
- Paranoid models: use `destroy()` for soft-deletes (never hard-delete)

**Reference:** `docs/architecture-api.md`, `docs/api-contracts-api.md`

---

### 5. Add a New Database Table

1. Create a new migration file in `apps/api/src/db/migrations/`:
   ```
   YYYYMMDD-NNNN-description.ts
   ```
2. Follow the existing pattern (see `docs/data-models-api.md` for column conventions)
3. Create the Sequelize model in the appropriate module
4. Run migration: `npm run db:migrate` (from `apps/api/`)

**Key rules:**
- All tables use `snake_case` columns, UUID primary keys
- Most domain tables are `paranoid: true` (add `deleted_at: DATE`)
- Call `initDb()` exactly once before using Sequelize
- Use GIN indexes for array columns (`disabilities`, `tags`, etc.)

**Reference:** `docs/data-models-api.md`

---

### 6. Add a New UI Page/Feature

**Quick reference — where things go:**
```
apps/ui/src/
├── app/pages/<FeaturePage>.tsx      # Route-bound page
├── domain/<feature>/
│   ├── <feature>.service.ts         # API calls (use apiRequest)
│   ├── <feature>.api.ts             # API endpoint definitions
│   └── types.ts                     # TypeScript types
└── app/routing/AppRoutes.tsx        # Register your new route here
```

**Add route in `AppRoutes.tsx`:**
```tsx
import { MyNewPage } from "@/domain/myfeature/MyNewPage";

// Inside AppRoutes:
<Route path="my-feature" element={<RequireRole><MyNewPage /></RequireRole>} />
```

**Add nav item in `navConfig.ts`** if it needs to appear in the sidebar.

**Key rules:**
- Always use `apiRequest` / `apiLongRequest` — never raw `fetch`
- Use `ThemeProvider` OKLCH tokens — never hardcode colors
- Wrap forms with TanStack Query `useMutation`, lists with `useQuery`
- Use components from `src/components/ui/` (Radix-based)
- Use `EmptyState`, `LoadingState`, `PageHeader` for consistency

**Reference:** `docs/architecture-ui.md`, `docs/component-inventory-ui.md`

---

### 7. Code Review

```
/bmad-agent-bmm-dev → [CR] Code Review
```
- Best used with a **fresh context window** for accuracy
- Reviews multiple quality facets (security, patterns, tests, style)
- Reference: `_bmad-output/project-context.md` (the rules the reviewer checks against)

---

### 8. Document a New Feature After Building It

```
/bmad-agent-bmm-analyst → [DP] Document Project
```
- Re-run the Document Project workflow to update `docs/` with new changes
- Choose "Re-scan entire project" if many things changed
- Choose "Deep-dive into specific area" for a targeted update

---

### 9. Brainstorm a New Idea

```
/bmad-agent-bmm-analyst → [BP] Brainstorm Project
```
or
```
/bmad-agent-bmm-analyst → [CB] Create Brief
```
- `BP` for open-ended brainstorming (multiple techniques, final report)
- `CB` for turning a specific idea into an executive product brief

---

### 10. Research Before Building

| Research Type | Command |
|---|---|
| Market/competitive analysis | `/bmad-agent-bmm-analyst → [MR] Market Research` |
| Domain/terminology deep dive | `/bmad-agent-bmm-analyst → [DR] Domain Research` |
| Technical feasibility / options | `/bmad-agent-bmm-analyst → [TR] Technical Research` |

---

## Key Reference Documents (Quick Lookup)

| Question | Document |
|---|---|
| "What is this project?" | `docs/project-overview.md` |
| "Where does this code go?" | `docs/source-tree-analysis.md` |
| "What API endpoint should I call / create?" | `docs/api-contracts-api.md` |
| "What tables exist? What columns?" | `docs/data-models-api.md` |
| "How is the API structured?" | `docs/architecture-api.md` |
| "How is the UI structured?" | `docs/architecture-ui.md` |
| "How does UI talk to API?" | `docs/integration-architecture.md` |
| "What UI components exist?" | `docs/component-inventory-ui.md` |
| "How do I set up locally?" | `docs/development-guide.md` |
| "How do I deploy?" | `docs/deployment-guide.md` |
| "What rules must I follow when coding?" | `_bmad-output/project-context.md` + `AGENTS.md` |

---

## Output Folders

| Folder | Contents |
|---|---|
| `docs/` | Generated project documentation (this folder) |
| `_bmad-output/planning-artifacts/` | PRDs, architecture docs, epics/stories |
| `_bmad-output/implementation-artifacts/` | Implemented code artifacts |
| `_bmad-output/test-artifacts/` | Test plans and generated tests |
| `_bmad-output/project-context.md` | AI agent coding rules (auto-generated) |

---

## Tips

- **Always start with docs**: Before touching code, read the relevant reference doc above. It saves significant time.
- **Fresh context for code review**: The `[CR] Code Review` works best without a long prior conversation in the window.
- **Quick flow for solo work**: If you're a solo developer, `quick-flow-solo-dev` skips the full PRD/Architect ceremony and gets you coding faster.
- **Course correction**: If mid-implementation you discover the approach is wrong, use PM's `[CC] Course Correction` — don't just push through.
- **`/bmad-help`**: Type `/bmad-help <your question>` inside any agent for contextual guidance on what step to take next.
