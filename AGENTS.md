# Geomind frontend: agent guide

React app for designing geothermal heating and cooling plants with an AI assistant. The flow and layout come from `../backend/docs/app-build/ui-mockup.html`; the API from `../backend/docs/app-build/contracts.md`.

## Read both: `.claude/` for agents, `docs/` for people

`.claude/` is written for agents: start with [.claude/README.md](.claude/README.md) (`notes/`
current work, `archive/` history). `docs/` is written for people and holds the reference for this
repo (conventions, architecture, design, API notes). Read both, and the project-wide context in the
project root (`../.claude/AGENTS.md`, the shared memory `../.claude/memory/MEMORY.md`, `../documents/`).

## Start here

State: Phase D integration done for the golden path (real and mock). Every screen is built and tested in mock mode; the types now come from the backend schema (`npm run gen:api` reads `../backend/openapi.json`, contract version 21). The golden path (`e2e/golden.spec.ts`) passes in real mode against the backend stack (`../backend/scripts/stack-up.sh`) and in mock mode; screenshots go to `.tmp/build/screens/`. Open items are in `docs/app-build/handover.md` of the backend repo. What exists:

- Tooling: Vite, React 18, TypeScript strict, Tailwind 4, ESLint (typescript-eslint strict), Prettier, Vitest, Playwright (smoke test and the golden path, real and mock), MSW.
- Shell: `/signin`; `/projects`, `/account`, `/users` (top bar); `/projects/:projectId/...` (top bar, breadcrumb, run pill, project sidebar). Auth guard, admin guard, unknown project redirect.
- `shared/api`: typed client, single-flight refresh, `ApiError`, session, pagination helpers (`pagedQuery`, `toItems`, `toAllItems`), `toFormData`, `projectQuery`, `meQuery`, `activeRunsQuery`, `resultsQuery`. `schema.d.ts` is generated and `types.ts` is the one place that names its types; there are no hand-written path or type blocks. Loose schema parts have small typed views (`layout.ts`, `shared/sse/runlog.ts`).
- `shared/ui`, `shared/quantity` (`Quantity`, `Missing`), `shared/layout`, `shared/forms` (schema forms, `docs/forms.md`), `shared/charts`, toasts.
- `src/mocks`: one file per domain, typed with the generated types; example data only.
- Identity, workspace (projects with "a copy of another project's problem" via `case_from`, overview, documents, settings), assistant (chat, runs; live runs over SSE, `docs/assistant.md`: a buffered `text.delta` replaces the step text, event run ids are written in the dashed form of the API), design (case, plant with ports from `GET /plant/flowsheet/ports`, study, results, report).
- Activity links open `/projects/<id>/<route>[/<id>]` with the routes the backend writes (`design/case`, `design/plant`, `design/study`, `design/results/<id>`, `design/report`, `assistant/runs/<id>`); `src/app/activity-links.test.ts` checks each one.

Commands: `npm run dev` (mock API), `npm run check` (types, lint, tests), `npm run build` (production build plus the bundle check), `npm run gen:api`, `npm run e2e`.

Read first: `docs/conventions.md` (rules and checklist), `docs/architecture.md` (folders, how to add a page and a mock), `docs/tokens.md`, `docs/charts.md`.

## Rules that tests enforce

- No comments in code except a one-line JSDoc directly above every exported function or component (`tests/rules/comments.test.ts`).
- Layer and feature imports (`tests/rules/boundaries.test.ts`): features import only `shared`, `lib` and themselves; no `index.ts` barrels.
- Dark theme tokens defined twice in `src/styles/index.css` stay identical (`tests/rules/tokens.test.ts`).
- `npm run build` fails when mock code (MSW, example fixtures) reaches `dist/`.

## Rules you must follow

- General, never competition-specific. No default values for engineering or economic inputs; show `<Missing>`. Numbers through `<Quantity>`.
- I/O functions are `from<Format>` / `to<Format>`. Folders one lower-case word. English only.
- Mock mode exists only in `npm run dev` (`VITE_API_MODE=mock|real`, mock is the default there). A production build always uses the real API.

## Ownership in Phase C

Each agent edited only its own paths: C5 `domains/{identity,workspace}`, `mocks/{identity,workspace}.ts`; C6 `domains/assistant`, `shared/sse`, `mocks/assistant.ts`; C7 `domains/design/{case,plant}`, `shared/forms`, `mocks/{case,plant}.ts`; C8 `domains/design/{study,results,report}`, `shared/charts`, `mocks/{study,results,report}.ts`. Keep each page's file name and export name (`page.tsx`, `CasePage`), because `domains/<domain>/routes.ts` imports them. Shared files (`src/app/**`, `package.json`, `src/shared/api/**`, `src/mocks/handlers.ts`) are changed only by the coordinator: list the change you need in your summary.
