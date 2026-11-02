# Architecture and folders

```
src/
  app/        router, layouts, providers, auth guard, error boundary, navigation
  domains/<domain>/<feature>/   page.tsx, components, api.ts, hooks, tests
  domains/<domain>/routes.ts    the routes of the domain
  shared/     ui, api, sse, forms, charts, quantity, layout
  mocks/      MSW handlers, one file per domain
  lib/        small pure helpers
  testing/    test setup, MSW server, renderApp (tests only)
tests/rules/  tests that enforce the code rules
```

Domains and features: `identity/{authn,me,users}`, `workspace/{projects,overview,documents,settings}`, `assistant/{chat,runs}`, `design/{case,plant,study,results,report}`.

## Import direction

`shared` -> `domains/*/*` -> `app`. Features import only `shared`, `lib` and themselves. `domains/<domain>/routes.ts` may import its features. `mocks` import only `shared` and `lib`. `tests/rules/boundaries.test.ts` fails on a violation. No `index.ts` barrels.

## Shell

Three levels, as in the mockup:

1. `/signin`: no chrome.
2. `/projects`, `/account`, `/users`: `HomeLayout`, top bar only. `/users` sits behind `AdminGuard`.
3. `/projects/:projectId/...`: `ProjectLayout`, top bar (breadcrumb, active-run pill, user menu) and the project sidebar. An unknown project redirects to `/projects` with a notice.

`AuthGuard` wraps levels 2 and 3 and redirects to `/signin?next=<path>`.

## Routes

Each domain exports a `DomainRoutes` object (`public`, `home`, `admin`, `project` lists) from `domains/<domain>/routes.ts`. `app/router.tsx` lists the four domains once. Project routes are relative to `/projects/:projectId`:

```
overview  assistant/chat/:chatId?  assistant/runs  assistant/runs/:runId
design/case  design/plant  design/study  design/results/:resultId?  design/report
documents  settings
```

Pages are lazy loaded. A feature fills its own `page.tsx` and keeps the exported name. A new sub-route is a line in its domain `routes.ts`, no router change.

## API client

`shared/api/client.ts` builds one `openapi-fetch` client over the generated types (`npm run gen:api`). It adds the bearer token, refreshes on 401 with one shared request (parallel 401s wait for it; the rotated refresh token is kept; a failed refresh signs out), retries the request once, and throws `ApiError` (`status`, `code`, `message`, `details`) for every non-2xx answer. Features call it only in their `api.ts`, through `toData`. Lists use `pagedQuery` and `toItems` from `shared/api/pagination.ts`.

`src/shared/api/schema.d.ts` is generated. Until the backend writes `openapi.json` it is a small hand-kept placeholder. The script strips an `/api/v1` prefix from path keys, so both spellings work. API type names are mapped in one place, `shared/api/types.ts`.

Until `gen:api` runs, a domain may declare the contract routes that the placeholder lacks in `domains/<domain>/paths.ts` with `declare module "@/shared/api/schema"` (interface merging; use a path key not yet in the placeholder, for example `{id}` instead of `{project_id}`). Mocks derive their body types from `paths`, because mocks may not import features. Remove these files after the first real generation.

## Mock and real mode

`VITE_API_MODE=mock|real`. Mock is the default only in `npm run dev`; `main.tsx` imports `mocks/browser` behind `import.meta.env.DEV`, so a production build drops MSW and the fixtures, and `scripts/check-bundle.mjs` (part of `npm run build`) fails if they come back.

One file per domain in `src/mocks/`, each exporting `<domain>Handlers()`, a factory with fresh in-memory state per call. `src/mocks/handlers.ts` has one line per domain. Handler bodies and responses use the generated types, so a contract change breaks the mock at compile time. Fixtures are example data and say so in their names (`example-*`).

Tests use the same handlers through `src/testing/setup.ts` (fresh state for each test) and `renderApp` from `src/testing/render-app.tsx`.

## Tests

`npm run check` runs types, ESLint, Prettier and the fast Vitest suite. Shell routing, auth guard, refresh flow, the no-comments rule and the import-boundary rule have tests. Playwright (`e2e/`) is for the single integration pass.
