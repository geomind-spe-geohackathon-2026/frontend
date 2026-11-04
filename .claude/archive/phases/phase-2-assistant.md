# Frontend F2: Assistant

## Goal

Chat with the agents: send a message, watch text and tool calls arrive live, answer approval requests and questions, cancel, and read the full log of every run.

## Context

- Follow the shared rules in `../docs/phases.md` (section "Rules for every phase") and the contracts in `../docs/contracts.md`.
- Needs F1. Read `../docs/contracts.md` sections 1 (assistant) and 2 (events).
- Build against the mock API: MSW plus a scripted SSE stream that plays the contract events. Switch to the real backend when B2 is done.

## Layout

```
src/domains/assistant/
├── chat/   chat list, messages, input, live stream, request cards, cancel
└── runs/   run log page
src/shared/sse/       one SSE hook with reconnect from Last-Event-ID
```

## Steps

1. **chat:** list and create chats for the open project; message list; input; posting starts a run and opens its event stream.
2. **Live view:** `text.delta` appends text; `tool.started`/`tool.finished` show compact tool cards (name, input, summary, duration, error); `usage` shows running tokens and cost; `run.finished` closes the stream.
3. **Requests:** a `request` event shows an approval card (approve, deny) or a question card (free answer or options); the answer goes to `POST /runs/{id}/answer`.
4. **Cancel** button while a run is active.
5. **runs:** the log page: steps, agents, every prompt and answer, tool calls with input and output, token and cost per call and in total. Export as JSON and Markdown. This is part of the competition deliverable, so it must read well on a screen recording.

## Done when

- A scripted run plays fully in the mock, including a request and a cancel.
- With B2 and S2 done, a real question about the example doublet runs end to end.

## Report back

What was built, contract issues, and a short screen recording.
