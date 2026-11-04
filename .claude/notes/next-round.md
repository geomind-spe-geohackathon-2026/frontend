# Frontend: next round

v1.1.13 (036dee0, 2026-11-03) shipped: config editor one row per field, project settings window, chat status dots, sidebar order, theme submenu, design tabs scrollbar.

Still open:

- Context ring and model picker in the chat box: need backend (context window size, last call size, model list/choice). Ask Sahand before any backend request.
- Plant flowsheet: smaller, about 2/3 of its current height, so the information under it shows without scrolling. (Sahand 16:17 UTC)
- Plant module editor (the "Select a module to edit it" box under/beside the canvas): remove the box; open the module editor as a window when a module is clicked on the canvas (and/or an Edit button next to Add module). (Sahand 16:19 UTC)
- Plant editor with gemini 0.6.0 (Sahand OK'd sharing 18:18 UTC): port details (`port` dict in describe), connection issues from `plant.check()`, compatible ports from `plant.suggest(port)` while drawing a pipe. Needs backend routes first (ask BACKEND I via coordinator when the round starts).
- Plant: a Problems panel under the flowsheet, like VS Code's (errors and warnings in a list, count per kind, click a row to select the module/port on the canvas), built from our own shadcn components. Feeds: current plant problems + gemini 0.6.0 plant.check() once the backend exposes it. (Sahand 21:57 UTC)
- Chat box: context ring and usage should look like Claude's composer (small ring, quiet text). (Sahand 21:58 UTC)
- Chat messages: action buttons on each user and assistant message (copy, etc.), like Claude's, shown on hover. (Sahand 21:58 UTC)

Round started by Sahand 21:59 UTC ("start").

v1.1.18 (d3efe41, 2026-11-03 ~22:20 UTC) shipped: usage ring + message buttons in chat; Plant flowsheet 2/3 height, module editor window + Edit module, VS Code-like Problems panel (reads `warnings` too).
Still open after 1.1.18: ring fill needs the model's context window from the backend (ask Sahand first); gemini 0.6.1 port suggest (`GET /plant/flowsheet/suggest?project=&port=`) once backend ships it.
