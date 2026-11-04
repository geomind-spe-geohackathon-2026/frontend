# Frontend F1: Shell, identity and projects

## Goal

The app shell with every domain in the sidebar, sign in and out, change password, user admin, and project management, working against a mock API built from `contracts.md` and switchable to the real backend.

## Context

- Follow the shared rules in `../docs/phases.md` (section "Rules for every phase") and the contracts in `../docs/contracts.md`.
- Repo: `/Users/sahand/Desktop/crust-team/frontend` (new). Read `../docs/feature-map.md` and `../docs/contracts.md`.
- The backend is built in parallel. Never wait for it: everything runs on the mock API until the backend is ready, then one setting switches to the real one.

## Stack

React, Vite, TypeScript, Tailwind, React Router, TanStack Query, MSW for the mock API, Vitest and Testing Library.

## Layout

```text
src/
├── app/         router, layout, sidebar, top bar, auth guard, providers
├── domains/<domain>/<feature>/   pages, components, api.ts, hooks
├── shared/      ui, api client, sse, longjob, charts
├── mocks/       MSW handlers, one file per domain, from contracts.md
└── lib/
```

- Folder and route names exactly as the feature map: `src/domains/plant/flowsheet/` is `/plant/flowsheet`.
- `shared/api/`: one typed client for `/api/v1` with the token, refresh and the contract's error shape. Types follow the contract.

## Steps

1. Project setup, lint, format, tests, `AGENTS.md`, `docs/`.
2. Shell: sidebar groups with the UI names from the feature map (Workspace, Assistant, Plant Model, Time Series, Well Performance, Reporting); pages that do not exist yet show a "coming soon" state. Well Integrity is hidden for now.
3. `identity/authn`: sign in, sign out. `identity/me`: change password. `identity/users`: admin list, create, change role.
4. `workspace/projects`: create, open, close, delete, import, export. The open project shows in the top bar and scopes every other page.
5. Mock API with MSW for all of the above; a setting `VITE_API_MODE=mock|real`.
6. A dark and a light theme from design tokens; works at laptop and tablet widths.

## Done when

- Every use-case above works on the mock API, and on the real backend once B1 is done.
- Tests cover sign in, project create and open, and the admin guard.

## Report back

What was built, any contract issue found, and screenshots of the shell.
