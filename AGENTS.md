# Geomind frontend: agent guide

React app for designing geothermal heating and cooling plants with an AI assistant. The flow and layout come from `../docs/ui-mockup.html`; the API from `../docs/contracts.md`.

## Start here

State: foundation done (build step B-F), Phase C not started. What exists:

- Tooling: Vite, React 18, TypeScript strict, Tailwind 4, ESLint (typescript-eslint strict), Prettier, Vitest, Playwright (one smoke test), MSW.
- Shell: `/signin`; `/projects`, `/account`, `/users` (top bar); `/projects/:projectId/...` (top bar, breadcrumb, run pill, project sidebar). Auth guard, admin guard, unknown project redirect.
- Every route has an empty page stub (`page.tsx`) that renders only its heading. Phase C fills them in.
- Sign in page is built. `/projects` shows only its heading.
- `shared/api`: typed client, single-flight refresh, `ApiError`, session, pagination helper, `projectQuery`, `meQuery`, `activeRunsQuery`.
- `shared/ui`, `shared/quantity` (`Quantity`, `Missing`), `shared/layout` (`PageHeader`, theme, route types, `useRequiredParam`), toasts.
- `src/mocks`: one file per domain; only `identity` and `workspace` have handlers (example sign in, three example projects).
- `src/shared/api/schema.d.ts` is a hand-kept placeholder until `npm run gen:api` reads `../backend/openapi.json`. Adjust names in `src/shared/api/types.ts` after the first real generation.
- C5 built (identity and workspace): account, users, projects home (search, new project, import zip), overview (ask box, stepper, recent chats, activity), documents, project settings, with MSW mocks. Their contract types are hand-written in each feature `types.ts`; `domains/{identity,workspace}/paths.ts` add the routes missing from the placeholder `schema.d.ts` by module augmentation: delete both files when `gen:api` has run.
- Not built yet: `shared/sse`, `shared/forms`, `shared/charts` (owned by Phase C agents C6, C7, C8).

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

Each agent edits only its own paths: C5 `domains/{identity,workspace}`, `mocks/{identity,workspace}.ts`; C6 `domains/assistant`, `shared/sse`, `mocks/assistant.ts`; C7 `domains/design/{case,plant}`, `shared/forms`, `mocks/{case,plant}.ts`; C8 `domains/design/{study,results,report}`, `shared/charts`, `mocks/{study,results,report}.ts`. Keep each page's file name and export name (`page.tsx`, `CasePage`), because `domains/<domain>/routes.ts` imports them. Shared files (`src/app/**`, `package.json`, `src/shared/api/**`, `src/mocks/handlers.ts`) are changed only by the coordinator: list the change you need in your summary.
