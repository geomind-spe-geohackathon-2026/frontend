# Knowledge = RAG documents (correction, Sahand 2026-11-03 18:10 UTC)

Sahand: "Knowledge is RAG, Connectors are MCP; do not mix these two with the agents' memory."

So Knowledge is NOT geomind's shared memory. It is a shared document base (papers, reports, catalogues,
standards) that the agents search (RAG), across all projects. The project Library stays the project's own files.

## What the frontend needs (proposal; backend picks the final shape)

Reuse the documents feature, with `project` optional:

- `GET /workspace/documents?cursor=` without `project` -> the shared Knowledge documents (`{items, next}`,
  same `Document` shape, `project: null`).
- `POST /workspace/documents` multipart `file` without `project` -> a shared Knowledge document (admin only),
  indexed like a project document (`searchable: pending | ready | failed`).
- `DELETE /workspace/documents/{id}` works for shared ones too (admin only).
- `GET /workspace/documents/formats` unchanged.
- Agents: the document search tool searches the project's Library AND the shared Knowledge (say which one a hit
  came from). Optional later: a project setting to leave Knowledge out.

## The agents' memory (geomind shared memory)

Keep it separate from Knowledge:

- `project.memory` on/off stays (Project settings and New project already use it).
- The memory routes built in backend 1.1.2 under `/workspace/knowledge` should move to `/workspace/memory`
  (same shapes), so the name Knowledge is free for the documents. The frontend shows no memory browser for now.

## Connectors

Unchanged: MCP servers, `/workspace/connectors`, `project.connectors`.
