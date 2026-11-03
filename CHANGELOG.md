# Changelog

The frontend uses semantic versions (v1.x.y). It talks to backend contract 1.0.0 and later.

## 1.0.0 (2026-11-03)

- Editor page (`/projects/<id>/design/editor`): plant, chat, studies and results on one screen; side panel with Chat and Inspect; results drawer; study toolbar with progress and Cancel.
- Run mode: the plant is read-only while a study runs; each module's capacity after it; studies on a chosen plant version (backend 1.0.0, hidden on older backends).
- The modules another author, such as the agent, changed are outlined on the canvas, with a notice and Show history.
- Chat: design alternatives with verdicts and the recommended design; readable text for tool problem codes and stop reasons.
- Phones: the plant is read-only, with the chat below it.
