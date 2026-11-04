# Frontend design proposal (draft 1, 2026-10-30; section 9 rebased on contracts v18)

Answers to the nine open questions in [brief.md](brief.md), for discussion with Sahand. Nothing here is final until he agrees. One recommendation per question, with its reason.

Facts from the other design threads that shape this one:

- gemini plants are **handwritten Python classes**; a plant file fills values but cannot create wiring. gemini will add a few heating-and-cooling **plant templates** (wiring in Python, sizes as parameters, units switchable); the agent picks a template and sizes it (`geomind/design.md`, section 9).
- geomind builds the catalogue (name, category) from `gm.modules`; every gemini declaration has a JSON `schema`, `quantity` and `unit`.
- Runs nest: `agent` is a dotted path, `parent` points to the parent run; delegation is a tool call that starts a child run.

---

## 1. Look and feel

**Recommendation: shadcn/ui on Radix and Tailwind, with our own tokens.**

- shadcn/ui copies component source into the repo (`src/shared/ui/`), so we own it, there is no runtime library to fight, and Radix gives accessible menus, dialogs and popovers. Only the components we use are added.
- **Tokens** as CSS variables, named by role, never by colour: `background`, `surface`, `border`, `text`, `muted`, `accent`, `success`, `warning`, `danger`, plus **stream tokens** for the flowsheet and charts: `stream-hot`, `stream-cold`, `stream-brine`, `stream-power`, `stream-refrigerant`, `stream-gas`. Tailwind reads the variables, so a theme is one block of variables.
- **Themes:** light and dark, default follows the system, a toggle in the user menu. The video is recorded in light (reads better after compression).
- **Density:** compact for engineering screens: 14 px base text, 32 px table rows, numbers in tabular figures, monospace (`JetBrains Mono`) only for JSON and ids. Text font `Inter`, icons `lucide-react`. All self-hosted, no CDN.
- **Numbers:** one `Quantity` component shows value + unit + significant digits everywhere (chat tables, cards, forms), so units are never missing.

## 2. App shell

```
┌──────────────┬──────────────────────────────────────────────────┐
│ GEMINI       │ Doublet Delft ▾          ● 1 run active   ☀  SN ▾│
│              ├──────────────────────────────────────────────────┤
│ Assistant    │                                                  │
│  Chat        │                  page                            │
│  Runs        │                                                  │
│ Plant Model  │                                                  │
│  Flowsheet   │                                                  │
│  ...         │                                                  │
│ Time Series  │                                                  │
│ Well Perf.   │                                                  │
│ Reporting    │                                                  │
│ ──────────── │                                                  │
│ Documents    │                                                  │
│ Guide        │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

- **Sidebar order:** Assistant first (the centre of Challenge 1), then the plant's life: Plant Model, Time Series, Well Performance, Reporting. Workspace's Documents and Guide sit at the bottom. Projects is not in the sidebar: it is the project switcher in the top bar. Identity is the user menu (profile, password, users for admins, sign out). The sidebar collapses to icons.
- **Open project in the URL:** `/projects/{id}/plant/flowsheet`. The feature path stays exactly the folder path; the prefix only says which project. Reason: reload, deep links, two projects in two tabs, and no global store for it. Pages without a project: `/projects`, `/signin`, `/account`, `/users`.
- **Assistant:** its own page in F2. A run indicator in the top bar links to the active run from any page. A side panel on every page comes after the hackathon (the same components, so it costs little later).

## 3. Assistant UI

**Chat page** `/projects/{id}/assistant/chat/{chatId}`: three columns.

```
┌ chats ─────┬ conversation ─────────────────────┬ run ──────────────┐
│ + New chat │ You: Design heating and cooling…  │ Running  02:14    │
│ Design A   │                                   │ 41.2k in · 3.1k out│
│ Design B   │ coordinator                       │ $0.18             │
│            │  ▸ search_documents   0.4 s  ✓    │                   │
│            │  ▾ designer (delegated)           │ Agents            │
│            │     ▸ simulate  doublet  3.2 s ✓  │  coordinator      │
│            │     ▸ verify    balance   ✓       │   └ designer      │
│            │  The design covers 4.1 MW heat…   │                   │
│            │ ┌ Approval needed ──────────────┐ │ Problem state     │
│            │ │ Run 8760 h simulation (≈ 2 min)│ │  demand 4.1 MW   │
│            │ │ [Approve] [Deny]               │ │  ...             │
│            │ └────────────────────────────────┘ │ Open full log →  │
│            │ [ message …            ] [Cancel] │                   │
└────────────┴────────────────────────────────────┴───────────────────┘
```

- **Message = blocks in event order:** text (Markdown, no raw HTML), tool cards, child-agent groups, request card. Text streams in from `text.delta`.
- **Tool card:** one line (tool, short input, duration, status); click to expand input and output summary. Errors show in red with the message.
- **Several agents:** a delegated run is a collapsible group headed by the agent name, nested by `parent`; at most two levels indented, deeper ones flattened with the full dotted path.
- **Request card:** inline at the end of the message and sticky above the input while the run is `waiting`; approval has Approve and Deny (with optional reason); a question has options as buttons and a free-text answer.
- **Right column (run panel):** status and timer, running tokens and cost, the agent tree, the problem state (from `state.changed`), and the link to the full log. This is what the video shows during a design run.
- **Live state** is one pure function `applyEvent(view, event)` folded over the stream; the same function rebuilds the view after a reload by replaying from event 0.

**Run log page** `/projects/{id}/assistant/runs/{runId}`: made for reading and recording.

- Header: status, loop, start, duration, totals (tokens in and out, cost), Export JSON, Export Markdown.
- Left: step tree by agent. Right: the selected step: the LLM call (system prompt and history collapsed, the new messages and the answer open), tool calls with input and output as formatted JSON, tokens, cost and duration per call.
- Footer table: totals per agent and per model.
- Runs list `/projects/{id}/assistant/runs`: every run of the project with status, loop, tokens and cost.

## 4. Flowsheet

**Recommendation: a real editor on the gemini plant spec (contracts v18), starting from a template.**

gemini plants are now a JSON spec (format 2): `modules` = id → `{type, params}`, `connections` = `{source: "id.port", target, kind?}`. A drawn diagram is therefore a real plant, so free drawing is in F3.

- **Data:** `GET /plant/flowsheet` returns `spec` plus derived `modules [{id, type, title, category}]` and `connections [{source, target, stream, kind}]`. The canvas edits a local copy of `spec`; derived fields only draw it.
- **Palette:** from `GET /plant/flowsheet/palette`, grouped by category (subsurface, wells, pumps, heat, cold, storage, consumers). Drag a module in to add it; its id is generated and editable.
- **Connect:** drag from a port to a port; the port colour is its stream token, and a connection between different stream types is refused on the canvas at once (the backend's validation stays the authority).
- **Validate while drawing:** after each edit (debounced), `POST /plant/flowsheet/validate` returns `{problems}`; each problem is shown on its module or connection by `path` and in a problems list. Save is disabled while there are problems.
- **Save:** sends the full `spec` with `base` and a note; on `409 conflict` the user reloads; `422 plant_invalid` shows its problems like validation. Discard returns to the saved version; an unsaved-changes warning on leaving.
- **Start:** an empty project offers templates (`template` + optional `parameters`); the result opens in the same editor.
- **Layout:** `elkjs` left to right (subsurface → wells → surface plant → consumers) when a spec has no positions; positions the user sets are saved as `layout` beside the spec (v18); moving a box sends `PUT /plant/flowsheet/layout {project, base, layout}`, debounced, with no new version; a save of a new spec sends its `layout` with the POST.
- **Node:** a card with the category icon, the id and title, and one or two key values. Click opens the parameter form (section 5) in a right panel.
- **One component, two places:** `PlantDiagram` (read-only) lives in `shared/`, used by the assistant's design result card; the Flowsheet page wraps it with the palette and editing.

## 5. Forms from metadata

- The backend serves each module's JSON schema from gemini (type, quantity, unit, bounds, default, description, section).
- One generic `ParameterForm` renders it: number with unit suffix, select for enums, switch for booleans, fields grouped by gemini's section headers. Description as a tooltip.
- **Validation:** `react-hook-form` with `ajv` on the same JSON schema, so bounds are never written twice; server validation errors map back to fields.
- **Units:** shown as gemini gives them; no conversion in the browser (physics stays in gemini). Unit choice can come later as a gemini service.
- **Versions by date:** an "effective from" date at the top of the form, a version list beside it, and "review as on date" as a read-only view of the same form.
- Unsaved-changes warning on leaving the page.

## 6. State and data

- **Server data only in TanStack Query.** No global store library.
- **Query keys** start with domain and feature, like the URL: `['plant', 'flowsheet', projectId]`, `['assistant', 'chat', projectId]`. Each feature's `api.ts` exports its key factory and hooks.
- **Global state is small:** the open project (URL), the session (auth context), the theme (localStorage).
- **Tokens:** access token in memory, refresh token in localStorage (the backend returns both in the body today). One refresh at a time; a failed refresh signs out.
- **Optimistic updates:** none, except showing the user's chat message at once. Engineering data is shown only after the server accepts it.

## 7. Mocks

```
src/mocks/
├── handlers/<domain>.ts      MSW handlers per domain, typed by the contract types
├── data/                      seed users, projects, chats
├── scenarios/                 scripted runs: lists of contract events with delays
│   ├── question.ts            one agent, two tools, an answer
│   ├── design.ts              coordinator + designer + verifier, an approval, usage
│   └── failure.ts             a tool error and a failed run
└── database.ts                in-memory store, reset per test
```

- Contract types are written once in `src/shared/api/types.ts` from `contracts.md`. When B1 is up, they are generated from the backend's OpenAPI (`openapi-typescript`) and the handwritten file goes.
- The SSE mock plays a scenario and honours `Last-Event-ID`.
- **Recorded scenarios:** a real run's events (exported from the run log) can be saved as a scenario, so the demo and the tests replay real runs without cost.
- `VITE_API_MODE=mock|real` switches at start.

## 8. Tests

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | `applyEvent`, API client (refresh, error shape), SSE parser and reconnect, runlog → Markdown, `Quantity` formatting |
| Component | Testing Library + MSW | the main use-case of each page |
| Flow | Playwright on the mock build | sign in → open project → ask → approve → read log; cancel |
| Screenshot | Playwright `toHaveScreenshot` | chat and run log at 1920×1080, light and dark |

Unit and component tests are the fast suite. Flow and screenshot tests are a separate profile, run before merging and before recording the video.

## 9. Changes proposed to contracts.md

Based on contracts.md version 18 (raise the file version on every edit to it):

- **In v3 / B1:** refresh route, fetch-based SSE with the bearer header, chat PATCH and DELETE, `run.request` and `run.error`, stable error codes, `?cursor=`, `validation_failed` details as `{"fields": {"<field>": "<message>"}}`.
- **In v7 (B2):** `GET /assistant/runs?project={id}`, `GET /assistant/chat/{id}/state` → `{version, state}`, `run.project`, chat `DELETE` answers `409` while a run is active (the UI disables Delete then), `model` on `step.started`, `request.options` as `[{value, label}]`. Mock them in F2 from the start.
- **Run after a reload:** the user message carries the run id; there is no placeholder assistant message. The chat view finds an active run from the last user message and replays its stream from event 0.
- **Problem state (settled by geomind):** `state.changed = {version, changes}`, `changes` a JSON Patch subset (add, replace, remove) with id-addressed lists (contracts.md section 2, "Problem state changes"). The run panel loads the state once from `GET /assistant/chat/{id}/state`, then applies patches in `version` order; a gap in versions triggers a reload of the state.
- **Questions:** `request.options` only for fixed choices; the answer is `{"text": value}`, approvals `{"approved": ...}`; an answer outside the listed values is `422 validation_failed`, so the card offers only the option buttons. A failed run shows `run.error` (`code` = stop reason, `message`).
- **After the hackathon:** sharing a project with other users.

- **Plant (v17, B3a):** F3 builds against it: `spec` + derived `modules`/`connections` (with `category`, `stream`, `kind`), palette, validate, save with full `spec` and `base` (`409 conflict` → reload), `plant_invalid` details `{problems: [{path, message, code}]}`. **v18:** `layout: {<module id>: {x, y}}` is stored beside `spec`; moving boxes updates the current version's layout without a new version; `null` means the frontend lays out with `elkjs`.

- **Replay text (v14):** `text.delta` is streamed but not stored; `step.finished = {index, usage, text}` carries the step's full text (`""` if none; geomind S2). `applyEvent` then replaces the streamed deltas of a step with that text, and a replayed run reads the same as a live one. A step still running at reload shows its text from its `step.finished`.

- **Identity behaviour (B1 run):** after `POST /identity/me/password` the current tokens are revoked as well, so the UI shows "password changed, sign in again" and goes to sign-in. There is no public sign-up or forgot-password route (404): users are created by an admin, so the sign-in page has no such links.

- **Event ids (v16):** sequence numbers can have gaps; the client only keeps the last id for `Last-Event-ID` and never checks for contiguity. Problem-state gaps are detected by `state.changed.version` only.
- **Compaction (v16):** the problem state's `compaction` entry is internal and never shown in the run panel.

## 10. Changes to the phase drafts

- **F1:** build on contracts v18; add the tokens, the shadcn/ui primitives, `Quantity`, the project prefix in the URL. `identity/users` stays small (list, create, change role).
- **F2:** three-column chat, run panel, run log page, runs list, scenarios as in section 7, flow and screenshot tests.
- **F3:** Flowsheet is a spec editor with palette, live validation and templates (section 4); `PlantDiagram` in `shared/`.
- F4 and F5 unchanged.
