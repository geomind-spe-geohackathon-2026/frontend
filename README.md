# Geomind frontend

Web app for designing geothermal heating and cooling plants with an AI assistant. React 18, TypeScript, Vite, Tailwind.

## Run

```
npm install
npm run dev
```

The development server uses the in-browser mock API (MSW). Sign in with `example-admin@example.test` / `example-password` (admin) or `example-member@example.test` / `example-password`.

To use a real backend in development: `VITE_API_MODE=real npm run dev`. The dev server proxies `/api` to `http://localhost:8000` (change with `VITE_PROXY_TARGET`). `VITE_API_URL` sets the API base (default `/api/v1`).

The golden path runs in both modes with `npm run e2e`. The real project needs the stack of `../backend` (`scripts/stack-up.sh`) on port 5173; the mock project starts its own dev server on 5174. Screenshots go to `.tmp/build/screens/{real,mock}/`. Set `E2E_EMAIL`, `E2E_PASSWORD` and `E2E_REAL_URL` to use another admin or address (defaults: the seeded `admin@example.com` / `example-password`, `http://localhost:5173`). The real study runs through Celery, so allow a minute.

A production build (`npm run build`) always uses the real API and contains no mock code; the build fails if it does.

## Commands

| Command           | What it does                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `npm run check`   | types, lint and format check, unit and component tests                                              |
| `npm run build`   | type check, production build, mock-free bundle check                                                |
| `npm run gen:api` | generates `src/shared/api/schema.d.ts` from `../backend/openapi.json`                               |
| `npm run e2e`     | Playwright: smoke test and the golden path, real and mock (needs `npx playwright install chromium`) |

## Docs

`AGENTS.md` (current state), `docs/conventions.md`, `docs/architecture.md`, `docs/tokens.md`, `docs/charts.md`.
