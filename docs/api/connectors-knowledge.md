# Connectors and Knowledge: what the frontend needs (2026-11-03, WEBSITE UX I)

Sahand (16:21 UTC): implement Connectors and Knowledge end to end, frontend and backend, in step with geomind.
This is the frontend's ask. Backend owns the final shape; names below are a proposal. Same error shape, auth and
`/api/v1` prefix as today. Admin only for writes unless you decide otherwise.

## Knowledge (geomind shared memory, `geomind/stores/memory.py`)

Two sections, as in geomind: `knowledge` (cited reference values) and `experience` (past verified designs, written by
the design loop only, read-only in the UI).

- `GET /workspace/knowledge?section=knowledge|experience&q=<words>&cursor=` -> `{items: Entry[], next_cursor}`
  - knowledge Entry: `id, item, value, unit, title, publisher, year, page, link, price_year, currency, status
    (verified|secondary|placeholder), note, created, created_by ("seed" | user | agent run id)`
  - experience Entry: `id, created, run, features {...}, verdict, kpis {...}, summary` (whatever geomind stores; the
    UI shows features, verdict, KPIs and lessons as JSON if unsure)
- `GET /workspace/knowledge/{section}/{id}` -> Entry
- `POST /workspace/knowledge` (section knowledge only) -> 201 Entry. Same validation as geomind `write_memory`:
  a source is required (title + publisher + year + page or link); `placeholder` not allowed by hand.
- `PATCH /workspace/knowledge/knowledge/{id}`, `DELETE /workspace/knowledge/{section}/{id}`
- `POST /workspace/knowledge/import` multipart CSV, same columns as `geomind memory seed` -> `{added, skipped, errors[]}`
- Memory on/off per project (competition runs keep it off): `project.memory: "on" | "off"` on the project object,
  set with the existing project PATCH. No default: a new project must say which (frontend asks in New project).
  Similarity threshold: backend setting, shown read-only (`GET /workspace/knowledge/settings` -> `{similarity}`).

## Connectors (MCP servers the agents can use)

- `GET /workspace/connectors` -> `Connector[]`
  - `id, name, url, transport ("http" | "sse"), auth ("none" | "bearer" | "header"), header_name?, has_secret (bool),
    enabled (bool), status ("unchecked" | "ok" | "error"), error?, checked, tools [{name, description, read_only?}]`
  - The secret is write-only: never returned.
- `POST /workspace/connectors` `{name, url, transport, auth, header_name?, secret?}` -> 201 Connector (checked once)
- `PATCH /workspace/connectors/{id}` (name, url, auth, secret, enabled), `DELETE /workspace/connectors/{id}`
- `POST /workspace/connectors/{id}/check` -> Connector with fresh status and tools
- Per project: `project.connectors: string[]` (connector ids the project's agents may use), via project PATCH.
- In runs (geomind side): an enabled connector's tools reach the agents (geomind MCP client). Each call shows in the
  run log as a normal tool step with `connector: <name>`. A tool that is not read-only asks for approval with the
  existing `run.request` kind `approval` (the chat already shows that state in blue).

## Frontend side (WEBSITE UX I does this once the API exists; MSW mocks first)

- Sidebar Knowledge and Connectors lose "soon" and open pages in the main panel.
- Knowledge: table with search and section tabs, add-entry window (source fields required), CSV import drop box,
  delete; experience entries read-only in a window.
- Connectors: list like Claude's connectors (name, status dot, tools count, switch), Add connector window, check
  button, tool list window; per-project choice in Project settings, memory on/off there too.
