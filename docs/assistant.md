# Assistant: chat, runs and run log

Folders: `src/domains/assistant/chat`, `src/domains/assistant/runs`, `src/shared/sse`, mock in `src/mocks/assistant*.ts`.

## Live run view

- `shared/sse/socket.ts`: `streamSocket` reads `WS /assistant/runs/{id}/stream`. The token goes in the first message, a 4401 refreshes it once, and a drop reconnects after the last event. A socket that never worked hands over to SSE, so a proxy that blocks sockets only costs the socket. Mock mode has no socket and uses SSE.
- `shared/sse/stream.ts`: `streamEvents({ path, socketPath?, signal, onEvent, onFailure, isFinished, lastEventId? })` tries the socket when `socketPath` is set, then reads `GET /assistant/runs/{id}/events` with `fetchEventSource`. The bearer token is read from the session on every attempt; a 401 triggers the shared single-flight refresh through the API client and one retry. When the server closes the stream before `run.finished`, the stream reconnects and the library sends `Last-Event-ID`.
- `shared/sse/events.ts`: `fromEvent(name, data, id)` checks the payload of every event type of the contract and throws `ApiError` `invalid_event` on a bad one. Unknown names give `null`.
- A failed `tool.finished` may carry `problem: {code, path, message, suggestions}` (contract version 50). `toFailureText` in `shared/sse/pretty.ts` turns it into readable text: `no_case` asks for a case, `case_incomplete` lists the missing values from `suggestions`; other codes show their message. The `error` text is cut by the backend and is not parsed when a problem is there. A failed run ends on the problem of its last tool.
- `chat/view.ts`: `applyEvent(view, event)` is pure. A view holds blocks in event order (text per step, tool cards, requests, end), the agent tree (from the dotted `agent` path), running usage, the pending request and the problem state with its version. `text.delta` appends to the text of its step, except a delta with `buffered: true` (the one a reconnect receives for a running step, without an id), which replaces it; `step.finished.text` replaces it too, so a replay from the stored events (no deltas) equals the live view. A `state.changed` with a version gap marks the state stale and the hook reloads the full state (`GET /assistant/chat/{id}/state`).
- `chat/use-run-view.ts`: the one Effect that streams; it resets the view and replays from event 0 on every mount (also under StrictMode). Events reach the view in batches of 80 ms, so a fast model or a replay does not render per event.
- `chat/paced-text.ts`: `usePacedText` shows growing text word by word: about 45 characters a second while text keeps up, faster as text piles up (`toSpeed`), so the reader stays about two seconds behind and a long answer ends within seconds. Updates slow down on long text, where a Markdown render costs more (`toTickMs`), and only that one reader re-renders. A hidden tab and reduced motion show text at once. A block's `settled` is the text that came whole (a replay or a reconnect), which never animates.
- `chat/blocks.tsx`: while a run goes, the newest text shows live under the steps, and a route still being written shows its answer so far (`fromPartialRoute`). It stays the same element when the run ends, so the answer does not restart.
- The conversation shows the last run of the chat live (blocks under its user message) and older runs as their assistant message.

## Types

`shared/sse/types.ts` has the event types. The REST types of chat, message and run come from the generated schema through `shared/api/types.ts`; `shared/sse/runlog.ts` has the typed view of the run log, which the schema leaves open. Run ids in events are 32 hex characters; `fromEvent` writes `run` and `parent` in the dashed form of the API (`fromRunId`), so they compare equal to API ids.

## Mock

`mocks/assistant.ts` plays a scripted run per message: coordinator reads the problem, delegates to the designer (nested agent), the designer asks for approval, then finishes after Approve or Deny; Cancel works at any time. The script is `mocks/assistant-script.ts` (also the recorded event list of the reducer test). Pace is 450 ms per event in `npm run dev` and zero in tests. A stream leaves out stored `text.delta` like the real store and sends one buffered `text.delta` (no id) for the step that is still open, on every connection.
