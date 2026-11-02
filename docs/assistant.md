# Assistant: chat, runs and run log

Folders: `src/domains/assistant/chat`, `src/domains/assistant/runs`, `src/shared/sse`, mock in `src/mocks/assistant*.ts`.

## Live run view

- `shared/sse/stream.ts`: `streamEvents({ path, signal, onEvent, onFailure, isFinished, lastEventId? })` reads `GET /assistant/runs/{id}/events` with `fetchEventSource`. The bearer token is read from the session on every attempt; a 401 triggers the shared single-flight refresh through the API client and one retry. When the server closes the stream before `run.finished`, the stream reconnects and the library sends `Last-Event-ID`.
- `shared/sse/events.ts`: `fromEvent(name, data, id)` checks the payload of every event type of the contract and throws `ApiError` `invalid_event` on a bad one. Unknown names give `null`.
- `chat/view.ts`: `applyEvent(view, event)` is pure. A view holds blocks in event order (text per step, tool cards, requests, end), the agent tree (from the dotted `agent` path), running usage, the pending request and the problem state with its version. `step.finished.text` replaces the text streamed by `text.delta`, so a replay from the stored events (no deltas) equals the live view. A `state.changed` with a version gap marks the state stale and the hook reloads the full state (`GET /assistant/chat/{id}/state`).
- `chat/use-run-view.ts`: the one Effect that streams; it resets the view and replays from event 0 on every mount (also under StrictMode).
- The conversation shows the last run of the chat live (blocks under its user message) and older runs as their assistant message.

## Types

`shared/sse/types.ts` has the event types, `shared/sse/contract.ts` the REST types of chat, message, run and run log. `shared/sse/paths.ts` adds the assistant routes to the placeholder `paths` of `shared/api/schema.d.ts` by module augmentation; delete it after `npm run gen:api` has read the real `openapi.json`, and drop the types of `contract.ts` that the generated schema now has.

## Mock

`mocks/assistant.ts` plays a scripted run per message: coordinator reads the problem, delegates to the designer (nested agent), the designer asks for approval, then finishes after Approve or Deny; Cancel works at any time. The script is `mocks/assistant-script.ts` (also the recorded event list of the reducer test). Pace is 450 ms per event in `npm run dev` and zero in tests. Replays from `Last-Event-ID` leave out `text.delta` like the real store.
