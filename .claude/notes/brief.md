# Frontend: brief for the design thread

This file hands the frontend work to a new thread. It holds everything decided so far, what is still open, and how Sahand likes to work. Read all of it before replying.

## 1. What the frontend is

The web app of the new GEMINI system, built for the SPE Europe Energy GeoHackathon. It replaces the legacy GEMINI frontend (Flask templates, jQuery, JointJS, DataTables, Grafana iframes). Engineers use it to manage projects, model their plant, look at data, analyse wells and pumps, and work with the AI assistant.

The competition: Challenge 1 is an agentic AI workflow driving GEMINI; Challenge 2 is an integrated deep-geothermal heating and cooling design with the agent log (prompts, answers, token usage). For the competition the critical part is the assistant: chat with live progress, and a run log page that reads well in a screen recording (the deliverable includes a video of at most 5 minutes).

## 2. Where it sits

```
crust-team/                      (Sahand's machine: /Users/sahand/Desktop/crust-team)
├─ infrastructure/   docker-compose
├─ frontend/         this repo (new)
├─ backend/          FastAPI
├─ geomind/          agent package
└─ gemini/           physics and engine

frontend → backend → geomind → gemini
```

- The frontend talks only to the backend, through the HTTP API and SSE events in `contracts.md`.
- The three repos are built in parallel. The frontend never waits: it runs on a mock API (MSW) built from the contract, and one setting switches to the real backend.

## 3. Decisions already made

- **Stack:** React, Vite, TypeScript, Tailwind, React Router, TanStack Query, MSW, Vitest and Testing Library. React Flow for the flowsheet, TanStack Table for editable tables, Plotly for charts.
- **Layout:**

```text
src/
├── app/         router, layout, sidebar, top bar, auth guard, providers
├── domains/<domain>/<feature>/   pages, components, api.ts, hooks
├── shared/      ui, api client, sse, longjob, charts
├── mocks/       MSW handlers per domain, from contracts.md
└── lib/
```

- **Domains and features** (from `feature-map.md`; one word, lower case, no underscores; the same names as the backend folders and the URL: `src/domains/plant/flowsheet/` is `/plant/flowsheet` and calls `/api/v1/plant/flowsheet`):

```
workspace/   projects  documents  guide
identity/    authn  me  users
assistant/   chat  runs
plant/       flowsheet  parameters  bindings  catalogue
timeseries/  dashboard  trends  sources  availability  softsensors
performance/ nodal  injectivity  pump
integrity/   (after the hackathon, hidden from the sidebar)
reporting/   operations  (regulatory after the hackathon)
```

- **UI names** come from the feature map (Workspace, Assistant, Plant Model, Time Series, Well Performance, Reporting; features such as Flowsheet, Tag Mapping, Trends, Nodal Analysis). Every name in the map has a "Why" line; keep them.
- **No logic in the browser that belongs elsewhere:** physics (unit conversions, pump head correction) goes to gemini; business rules (annulus alarms, maintenance schedule, risk factor) go to backend services. The frontend displays.
- **Shared pieces:** one typed API client (token, refresh, the contract's error shape), one SSE hook with reconnect from `Last-Event-ID`, one long-job hook (progress, timeout, cancel), one chart wrapper (theme, units on every axis, the same units across related charts).
- **Assistant:** live text, compact tool cards, running tokens and cost, approval and question cards, cancel, and a run log page with every prompt, answer, tool call and token count, exportable as JSON and Markdown.
- **Legacy lessons:** no DataTables Editor (paid trial), no CDN-only libraries, no `eval`, escape all server text, unsaved-changes warnings, validation from module metadata (units, bounds), times shown in the user's timezone and sent as UTC.
- **Phases:** F1 shell, identity and projects; F2 assistant; F3 plant model; F4 time series; F5 well performance.

## 4. Open questions to think through

Think them through, propose, and discuss with Sahand before writing any prompt.

1. **Look and feel:** design tokens, dark and light themes, density for engineering screens, a component library or own primitives (for example Radix or shadcn/ui on Tailwind).
2. **App shell:** sidebar order and grouping, project switcher, where the assistant lives (its own page, a side panel on every page, or both).
3. **The assistant UI** in detail: message layout, tool cards, request cards, how a long design run with several agents is shown, the run log page.
4. **Flowsheet:** how gemini modules, ports and stream types appear on the canvas; palette by category; editing parameters from the canvas.
5. **Forms from metadata:** generating parameter forms from module metadata (units, bounds, versions by date).
6. **State and data:** TanStack Query keys per domain, the open project as global state, optimistic updates or not.
7. **Mocks:** how MSW handlers and a scripted SSE stream are organised so they track `contracts.md`.
8. **Tests:** what is tested at unit, component and flow level; screenshot checks for the video pages.
9. **contracts.md:** check the routes and payloads of steps 1 and 2 against the UI needs and propose changes.

## 5. Files to read

In the project folder:

- `frontend/feature-map.md`: domains, features, use-cases, folder names, with legacy IDs.
- `phases/README.md`: all phases, shared rules.
- `phases/contracts.md`: HTTP API and live events.
- `phases/frontend/phase-1-shell.md` to `phase-5-performance.md`: phase drafts; the design thread may change them.
- `backend/brief.md` and `geomind/brief.md`: the other two sides.

On Sahand's machine (ask him to attach if needed): `crust-team/gemini-legacy-frontend-analysis/frontend-features.md`, the inventory of the legacy frontend (18 pages, 260 features) with its broken parts and the domain logic that must move out of the browser.

## 6. How Sahand works

- Writes in Persian; reply in Persian. Start every line with a Persian word, put English names in code blocks or follow them with a right-to-left mark, keep mixed lines short.
- This thread designs and writes prompts. Sahand runs the work in Claude Code on his own machine. Do not write code in a repo or push anything.
- During design talk, discuss only. Write or hand over a prompt only when Sahand says «go».
- Names matter a lot to him. Give every name a reason; prefer industry terms; avoid vague words. Folder names one word, no underscores.
- He wants a simple structure and hidden complexity.
- Code quality bar for every prompt: simple and readable, just enough code, small components and functions, nesting at most 3, no dead code, no comments inside code, full-word names.
- Every prompt: fast targeted tests while working, full fast suite before commit, never the network in tests; temporary files in `.tmp/`; update `AGENTS.md` and docs in the same commit; subagents use lighter models; say so when something is missing or risky; commit per step, no push until told.
- He accepts what he does not object to, but says clearly when he disagrees. Recommend one option; do not list many.

## 7. The first goal of the new thread

Design the frontend in depth with Sahand, answering section 4. When he says «go», write the Claude Code prompt for phase F1 into `phases/frontend/` (updating `phase-1-shell.md` or replacing it), following section 6.
