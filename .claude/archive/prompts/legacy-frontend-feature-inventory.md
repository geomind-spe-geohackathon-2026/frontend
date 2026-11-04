# Prompt: feature inventory of the legacy GEMINI frontend

You are working in `/Users/sahand/Desktop/crust-team/gemini-legacy`, the old GEMINI suite.
We will reimplement its frontend ourselves, so we need a complete list of every page, screen and
user-facing feature, and exactly which files implement each one.

## Rules

- Read-only task. Do not edit, move, format, install, commit or push anything inside
  `gemini-legacy`. Do not run the app, a dev server or the tests.
- Frontend only. Do not analyse backend Python code and do not read the backend inventory.
  Record backend calls only by method and URL as they appear in the frontend code.
- Write everything to `/Users/sahand/Desktop/crust-team/gemini-legacy-frontend-analysis/`
  (outside the legacy folder): the result in `frontend-features.md`, scratch in `scratch/`.
- If you use subagents, use lighter models (sonnet or haiku), not the main model.
- Every claim must cite a real path and line range (`path/to/file.html:40-88`). If you could not
  confirm something, mark it `UNVERIFIED` instead of guessing.
- Speak up at the end: list anything important you could not classify, any third-party
  library or CDN asset we would need to replace, and anything that blocks a reimplementation.

## Step 1: find the frontend

The frontend may be Flask/Jinja templates with static JS/CSS, a JS framework app (React, Vue,
Angular), Plotly Dash, or a mix. Find all of it:

1. List the tree (skip `.git`, `node_modules`, `venv`, caches, build output, datasets).
2. Search for `templates/`, `static/`, `*.html`, `*.jinja*`, `*.js`, `*.ts`, `*.jsx`, `*.tsx`,
   `*.vue`, `*.css`, `*.scss`, `package.json`, `webpack`/`vite` configs, `render_template(`,
   `dash.Dash(`, `dcc.`, `html.Div`, `@callback`/`app.callback`.
3. Record: frameworks and versions, build tooling, how assets are served, base layouts and
   template inheritance (`{% extends %}`, `{% include %}`, macros), and third-party libraries
   (Bootstrap, jQuery, Plotly, Chart.js, Leaflet, DataTables, etc.) with where they are loaded.

## Step 2: pages and navigation

For every page or screen record:

- URL / route that renders it
- template or component file(s) (`file:line`), including base layout and partials it uses
- what the user sees and can do there, in one or two sentences
- how the user reaches it (menu, link, button, redirect) with the nav file location
- access rules visible in the UI (login only, role-based menu items)

Also draw the navigation map: menus, sidebars, tabs, breadcrumbs, and which page links to which.

## Step 3: features inside each page

For each page list its interactive pieces:

- forms (fields, validation, submit target URL and method)
- tables and lists (columns, sorting, filtering, pagination, data source)
- charts and plots (library, chart type, data source endpoint, refresh/interval behaviour)
- maps, diagrams, 3D views, file upload/download, export buttons
- modals, popups, chat widgets (e.g. chatpopup), notifications, toasts
- realtime pieces (websocket/socket.io, polling, server-sent events)
- every call to the backend: `fetch`, `$.ajax`, `axios`, `XMLHttpRequest`, form `action`,
  Dash callbacks; record method, URL, payload, and the JS function location (`file:line`)
- client-side state: localStorage/sessionStorage/cookies, global JS variables
- i18n, theming, responsive behaviour, if present

## Step 4: write the result

Write `/Users/sahand/Desktop/crust-team/gemini-legacy-frontend-analysis/frontend-features.md` with:

1. **Overview**: stack, frameworks, build/serve setup, third-party libraries and where loaded.
2. **Page index**: one table row per page:
   `ID | Page | URL | Template/component (file:line) | Reached from | Access`.
3. **Feature list grouped by page**: table
   `ID | Feature | Type (form/table/chart/...) | UI file (file:line) | JS logic (file:line) |
Backend call (method URL) | Notes`.
4. **Backend call index**: every frontend-to-backend call in one flat table (method, URL,
   caller file:line, page ID).
5. **Shared UI pieces**: layouts, partials, macros, reusable JS/CSS, with locations and which
   pages use them.
6. **Navigation map**: as a nested list or a mermaid diagram.
7. **Dead or broken UI**: templates never rendered, JS never loaded, links to missing routes,
   commented-out features, with evidence.
8. **Open questions and risks** for the reimplementation.

Before finishing, cross-check: every template/component file found in Step 1 must appear in the
page index, shared pieces, or dead code section; report the file count and how many you mapped.
Then reply with a short summary: page count, feature count, backend call count, and the open
questions.
