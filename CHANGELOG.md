# Changelog

The frontend uses semantic versions (v1.x.y). It talks to backend contract 1.0.0 and later.

## 1.1.143 (2026-11-05)

- QA-341 follow-up: a finished run's summary reads per-agent totals from the run's `instances` (backend 45c4ce2), so the frozen busy list survives a reload; nothing shows until the backend field is live.

## 1.1.142 (2026-11-05)

- QA-292: the auto-approve question shows only when the user has never chosen; the choice is stored per user in the backend (GET/PUT /assistant/preferences) instead of the browser; until the backend route is live the question stays hidden.

## 1.1.141 (2026-11-05)

- QA-348: assistant answers show their time after the copy and log icons, like user messages ('20:55', with the date when not today).

## 1.1.140 (2026-11-05)

- QA-341: a finished run keeps its busy list (each agent and the Total, frozen and marked done) and its summary reads steps · tokens · cost · total time.
- QA-344: the dot next to a chat in the sidebar is green and pulsing while its run is running or waiting, grey and still otherwise.
- QA-345: the live text under the busy list starts with the name of the agent writing it.
- QA-339: a question answered automatically (event `question.auto_answered`) shows as a settled card tagged 'Answered automatically', never an input.

## 1.1.139 (2026-11-05)

- QA-336 (blocker, frontend part): a waiting run whose question never reached the chat shows its card from the run's stored `request`, so the user can answer and free it; an unfinished run with no card re-reads the run every 15 s.

## 1.1.138 (2026-11-05)

- QA-328: the Plant dot's tooltip says how to clear 'Not saved' (save a design as the plant on the Plant page).

## 1.1.137 (2026-11-05)

- QA-290 (reopened): only a newer case makes a result 'Out of date' (Report, Results, Study, Design tab dots, Overview); a newer plant version is a muted note ('A newer plant version exists (v2); this result is for plant version 1'), since it may be another plant.

## 1.1.136 (2026-11-05)

- QA-328: the Study and Results pages say on the page when their newest result is out of date (case or plant changed since), with New study / Run the study.

## 1.1.135 (2026-11-05)

- QA-328: every Design tab status dot has a tooltip with its state in words, the reason (e.g. 'Out of date: the plant (version 3, now 4) changed after the newest result was made') and the action that clears it; the stray study-name tooltip under Design is gone.

## 1.1.134 (2026-11-05)

- QA-322: Days covered follows the final gemini 0.6.31 shape: `labels.other` null leaves the topped-up and other-only bands out of the legend.

## 1.1.133 (2026-11-05)

- QA-322 (frontend part): Days covered names its sources from the coverage day's `labels` (gemini 0.6.31: e.g. cooling 'Absorption chiller (geothermal)' / 'Electric chiller'), shows `no_demand` days as 'No demand', and never calls the electric chiller 'backup'; old results fall back to Geothermal/Backup for heating and Main/Other source for cooling.

## 1.1.132 (2026-11-05)

- QA-316: the auto-approve question shows at most once per browser (remembered after any answer or dismissal); the toggle is quiet when off (no blue). The Study table fits its pane with the chat open: names wrap (full name on hover), Compare structures / Cancel / Run again sit in a '...' menu.

## 1.1.131 (2026-11-05)

- QA-307: the busy list ends with a Total row laid out like the agent rows (Total · N agents working · steps · tokens · cost · time); it replaces the 'Steps so far' line and opens the steps window.
- QA-311: the Results tab strip shows no scrollbar when the tabs fit; it still scrolls sideways when they do not.
- QA-313 (frontend part): the report reads like a document: heading sizes per level with space above, 3.5rem between sections, paragraphs at most 75 characters wide, muted centred captions under figures and tables, full-width tables, flowsheet at a '<!-- flowsheet -->' marker.
- QA-305: a case value changed by hand on the Case page gets the source 'user: set by hand on the Case page'; unchanged values keep their source, removed ones lose it.

## 1.1.130 (2026-11-05)

- QA-302: the study record of a sensitivity shows a table ranked by effect (rank, value, low, high, result at low and high, swing, feasible); the raw JSON is in a collapsed section.
- QA-303: a case value set from a file (such as economics.json) shows a read-only Key / Value / Source table above the raw JSON, with the agents' sources from about.sources.

## 1.1.129 (2026-11-05)

- QA-290: the Report page warns "Out of date" when its result ran on an older case or plant version than the project's current ones, and says to run the study again before sending the report.
- QA-292: a new chat first asks in a small dialog whether to turn on auto-approve; the answer sets the chat's auto-approve (Esc counts as No).
- QA-297: Days covered shows heat-pump electricity (`electricity`, gemini >= 0.6.22) as its own band and share; a day served by geothermal plus heat-pump electricity without backup counts as served by geothermal.

## 1.1.128 (2026-11-05)

- QA-291: each agent line of the busy list reads steps · tokens · cost · time, live (tokens and cost summed from that agent's step.finished usage); the totals line the same.
- QA-286: number fields show at most 7 significant digits (no float32 noise such as 0.4000000059604645), also for % fields; min/max hints are in the field's unit (barg, mD, °C ...), or name the SI unit when no conversion is known. Display only.

## 1.1.127 (2026-11-05)

- QA-281: on Days covered, "geothermal topped up by backup" days are diagonal stripes (mostly the geothermal colour with thin backup stripes), clearly different from plain "Backup only"; the legend uses the same stripes.
- QA-244 (reopened): Compare points carry their table row number (# column) instead of the full name, so labels no longer overlap each other, the spread bars or the chart's right edge; the full name is in the tooltip and the table.

## 1.1.126 (2026-11-05)

- QA-267: the event parser kept no `ts` on step events, so every stage timer counted from the page load; it now keeps the server time of `step.started` and `step.finished`, and the timers stay the same after a reload.

## 1.1.125 (2026-11-05)

- QA-255: the New project dialog lists the connectors that are On, all checked, and the new project gets the checked ones (`mcp`), so the agents of a new project have its connector tools (open-meteo).

## 1.1.124 (2026-11-05)

- QA-249: each Runs and logs row shows the user message that started the run (`prompt`, backend 1.1.111; first 120 characters), with the chat title below it.

## 1.1.123 (2026-11-05)

- QA-239 (frontend part): reads the `feasible` field of backend 1.1.110; a result with `feasible: false` (a plant that does not serve every demand, such as a heating-only plant on a case with cooling) is never the best in Compare, never on the trade-off line, never the report's default, and its checks read "infeasible: does not serve every demand".

## 1.1.122 (2026-11-05)

- QA-246: the chat stream no longer refetches on every event: refreshes it asks for (chats, agents, the project after the run) are collected and sent at most once per 2 s, without cancelling a request already on its way (that cancel-and-repeat made bursts of 20 identical calls, and a replay of a long run made hundreds). A 429 answer is retried with backoff (5, 10, 20, 40 s) instead of showing an error.

## 1.1.121 (2026-11-05)

- QA-244: Compare rounds the depth (3,282 m, not 3281.98316...); point labels of designs close together are moved apart; "The dashed line is the trade-off line" shows only when the line is drawn (two or more designs on it).

## 1.1.120 (2026-11-05)

- QA-232: after a deploy, a tab that fails to load a lazy page chunk of the old build reloads itself once (at most once per 30 s) instead of showing "Something went wrong".

## 1.1.119 (2026-11-05)

- QA-215 (frontend part): each Results tab shows its plant version (when known) and time, so repeats of one design can be told apart; the tab strip scrolls on its own instead of pushing the panel sideways.

## 1.1.118 (2026-11-05)

- QA-213: a capacity tile with no peak shows the reason the API gives, else "no peak use measured for a rating in <unit>", never "not used in this run" (an exchanger rated in MW/K has no peak even when it ran).
- QA-214: Days covered no longer says geothermal was "off" on days it gave none of that demand; it may have run for another service (summer cooling).

## 1.1.117 (2026-11-05)

- QA-193: on the approval card only the request text and JSON scroll; the reason box and Approve/Deny stay visible below it. The "Accept case" approval says in one sentence what it does.

## 1.1.116 (2026-11-05)

- QA-185: a value set as a file (such as the case economics in `economics.json`) switched to "Fill in here" now loads the file's content into the form instead of an empty `{}`; a file that cannot be read keeps the file and the view.

## 1.1.115 (2026-11-05)

- QA-170: an event that names no agent (run-level) no longer adds a busy-list line; the phantom "Coordinator · Thinking · 0 steps" with a running timer is gone.

## 1.1.114 (2026-11-05)

- QA-164: the Search dialog sends the typed term to the projects API (debounced), so it finds every project, not only the first page of 50.

## 1.1.113 (2026-11-05)

- Plan E2: each agent line in the busy list shows a stage timer (time since its first step, from the server `ts` of backend 1.1.99), next to its step count.

## 1.1.112 (2026-11-05)

- QA-146: the busy list never shows an unnamed line: an agent run with an empty id (the root run) is named "Coordinator", and an empty instance name falls back to the agent's name.

## 1.1.111 (2026-11-05)

- QA-139 follow-up: the Flowsheet tab of a plant version is the Plant page's own diagram, read-only: zoom, fit, Arrange (view only), minimap, stream legend, group frames; modules added or changed from the version before are outlined and marked "changed".

## 1.1.110 (2026-11-05)

- QA-141: no templates anywhere: the empty-plant card no longer offers "Start from template" (it points to the chat); the templates dialog is removed.
- QA-142: "Steps so far", "Worked through" and each agent or instance line open their steps in a window (live, scrollable, closable) instead of expanding inside the chat, so the chat no longer jumps.

## 1.1.109 (2026-11-05)

- QA-137, QA-139: the Plant and Case History window's height follows its content (at most the screen), so a short list or a two-row change no longer sits over a large empty area; the tables use the room there is and scroll inside. A plant version has a third view, "Flowsheet": the diagram of that version (every module and connection), with the modules added or changed from the version before named above it.

## 1.1.108 (2026-11-05)

- QA-138: the Plant toolbar no longer has "Start from template" (user decision: no templates, IMP-023 rejected).

## 1.1.107 (2026-11-05)

- IMP-025 (frontend part): parallel instances of one agent ("Geoscientist I", "Geoscientist II") each get their own line in the chat while a run works, under their lead, with what they do and their own step count ("Geoscientist I · Thinking · 12 steps"); each line opens that instance's own steps. Lines, steps and counts are keyed by agent and `instance`, so two instances never mix (stream events carry no run id). The run panel's agent list and the chat's per-agent usage show the instance name.

## 1.1.106 (2026-11-05)

- QA-135 (frontend part): Overview and the sidebar judge "Out of date" by the newest result; they took the first of the list, which comes oldest first, so a project with a current result still read Study and Results "Out of date".

## 1.1.105 (2026-11-05)

- QA-133, QA-134: a tall approval or question card no longer pushes the message box (and its Cancel run button) below the window: the card is at most 45 % of the window high and scrolls inside, so Cancel run stays reachable while a run waits for an answer.

## 1.1.104 (2026-11-05)

- IMP-024: "Run again" on every study that is not running opens New study filled with its kind, name ("<name> again"), the settings its kind knows and its plant version (empty runs on the current plant); everything stays editable before Create study.

## 1.1.103 (2026-11-05)

- QA-107, QA-126: Days covered states the year on the report's basis: "Geothermal gave 96% of the year's demand (96614 of 100690 MWh), backup ..., unmet 4%", so it agrees with the report's "Geothermal share of heat"; the days the main source was off are named only when there are some.

## 1.1.102 (2026-11-05)

- QA-118: no silent rounding of values: approval and question cards show the assistant's numbers as sent (they were cut to 4 significant digits), tool cards show decimals in full (were 6 digits), and form fields shown in another scale (mol %) show 15 significant digits (were 6), the most a scaled value can carry without float noise.

## 1.1.101 (2026-11-05)

- QA-126: Days covered tells apart "Geothermal only", "Geothermal topped up by backup" and "Backup only (geothermal off)" (plus partly short and short), states the backup's share of the delivered energy and the days the main source was off, explains what backup is, and gives each topped-up day its backup share on hover.

## 1.1.100 (2026-11-05)

- QA-127, QA-109: the Report opens on the best result, not the first: among design results whose checks all pass, the best on the objective of the newest minimise/maximise study, else the newest feasible result, else the newest result. Its Agent log shows the run that started the result's study, without Options; a result or run in the URL still wins.

## 1.1.99 (2026-11-05)

- QA-102 (frontend part): Overview Activity: a "Saved case/plant version N" row with a link id opens that page with History on version N (`?version=N`; closing History drops the parameter); a study row opens the study's record; rows read in sentence case ("Assistant saved plant version 3"). Older rows without an id still open the page.

## 1.1.98 (2026-11-05)

- QA-110 (frontend, plant and shared): Case and Plant History share one list and one read-only version view (`shared/versions/`): no "#" column beside Version, the full note on as many lines as it needs, Saved by "Assistant" from Version.by, Open on every row; an opened plant version shows its changes from the version before (modules, connections, spec, structure) and all values; Restore loads it into the editor as before. Paths in the change tables are shown in full.

## 1.1.97 (2026-11-05)

- QA-110 (frontend part): case History: each version has Open; an opened version is read-only, shows its changes from the version before (path, change, old and new value, source; files included) and all its values, and has "Restore this version" (POST /design/case/versions/{n}/restore with the latest number as base; a 409 says the case was saved again; disabled while the form has unsaved changes). Saved by shows "Assistant" for versions the assistant saved. New endpoints typed in `shared/api/pending.ts`.

## 1.1.96 (2026-11-05)

- QA-101: Overview, Recent chats: rows line up with the card title, the time column is as wide as its longest label, a long title stays on one line (ellipsis, full text on hover), the running badge stays inside the card, and the card is as tall as its rows.

## 1.1.95 (2026-11-05)

- QA-100: Runs and logs, the "Per agent" and "Per model" titles are section titles (larger, semibold), no longer the size of the column headers.

## 1.1.94 (2026-11-05)

- QA-117: a question card's option buttons wrap their text inside the card (left aligned, as tall as the text) instead of running past its edge.

## 1.1.93 (2026-11-05)

- QA-115: every group of a schema form (Case, Plant, Economics ...) starts collapsed; a group holding a form error, a gemini problem or a value gemini reports missing opens and shows a warning mark; a group the user opened or closed keeps that state while the page stays loaded (also across the form's tabs).

## 1.1.92 (2026-11-05)

- QA-107 (b): Days covered shows a short day that still got part of its demand as "Partly short" (amber), with its unmet share on hover and the mean share in the legend ("Partly short: 243 days, 5% unmet on average"); "Short" is left for days that got none. The legend states the rule: a day counts as short when any of its demand is unmet.

## 1.1.91 (2026-11-05)

- QA-113 (user): the shared drop zone (`shared/attach/drop-zone.tsx`, used by Knowledge, the project Library and New project) is about three times taller (128 px under a list, 192 px when empty), icon and text centred; while files are dragged over it the border turns solid accent with a soft accent fill and ring, and it reads "Drop to add the files" (no flicker when the pointer crosses its text).

## 1.1.90 (2026-11-05)

- QA-108 (user, addition): every table has a row-number column "#" (1, 2, 3 ..., narrow and muted), drawn by a CSS counter (`.data-table-numbered` in `styles/index.css`) so no table needs its own cells; on by default in DataTable and DataTableFrame (prop `numbered={false}` where a table has its own rank: Alternatives, evolve structures) and in Markdown tables. The chat's runs window now uses the shared table too, so every table in the app has the three backgrounds and the numbers.

## 1.1.89 (2026-11-05)

- QA-111 (user): one project menu (`domains/workspace/settings/project-menu.tsx`) for the sidebar and the project cards: Pin, Rename (dialog), Settings (the settings window) and Delete (a destructive confirmation naming the project; after it, back to Projects). The routes hand the menu to the Projects page, so features keep their import boundaries.

## 1.1.88 (2026-11-05)

- QA-108 (user): the shared data table has three backgrounds from the theme tokens: the sticky header on `sunken`, odd rows on the page colour, even rows on `sunken` at 60 %; the hovered row turns full `sunken`. Selected and recommended rows keep their own colour. Works in light and dark, everywhere the DataTable (and Markdown tables) is used.

## 1.1.87 (2026-11-05)

- QA-103 (user): one shared formatter (`shared/quantity/usage.tsx`: formatDuration, formatTokens, Duration, Tokens) writes durations as h/min/s ("7 h 43 min 58 s", "4 min 12 s", "38 s", "1.2 s") and token counts with K/M ("2.91 M tokens in · 90.6 K tokens out"); the exact number shows on hover. Used in the run header, run list and project total, the step tree, LLM and tool calls, the per-agent and per-model totals, the chat's usage ring, agent usage, activity durations, run_python cards and the chat timer.

## 1.1.86 (2026-11-05)

- QA-098 (user): the browser tab shows the GeoMind mark. The icons lived in `public/`, which the production build leaves out (it holds the mock service worker), so every icon URL returned index.html. They now live in `static/`, the build's public folder: favicon.ico (16/32/48), favicon.svg, favicon-16/32.png and a 180 px apple-touch-icon, all linked in index.html; nginx serves them as files with a one-day cache and never falls back to index.html for them. In `npm run dev` the tab has no icon.

## 1.1.85 (2026-11-05)

- QA-096 step 4: the lists use the shared data table too: studies, runs and their totals, project Library, users, case and plant history (sticky header, scrolling inside the box; names, notes and e-mails one line, open in full on a click). The chat's usage popover keeps its small table.

## 1.1.84 (2026-11-05)

- QA-096 step 3: Results (compare, constraints with the module in its own column, sensitivity, spread) and the evolve structures (ranked and side by side) use the shared data table; `DataTableFrame` holds tables that build their own header.

## 1.1.83 (2026-11-05)

- QA-096 step 2: Markdown tables (chat answers, .md files, reports), the agent study record and the chat's Alternatives use the shared data table. A cell opens its full content only when it is cut; DataCell and DataHead take any content (links, code) as children.

## 1.1.82 (2026-11-05)

- QA-096 (user): a shared data table (`shared/ui/data-table.tsx`: DataTable, DataHead, DataCell) with compact one-line rows, cells cut with an ellipsis in a capped width (a click opens the full text in a popover), a header that stays on top and scrolling both ways. The CSV view of Knowledge and project files uses it first; other tables follow.

## 1.1.81 (2026-11-05)

- QA-093: the New project dialog no longer closes on a click outside it (Cancel, the close button and Escape still close it); Cancel and Create stay visible at the dialog's foot in a short window; a missing name or Shared memory scrolls to and focuses that field beside its message.

## 1.1.80 (2026-11-05)

- QA-089 (Sahand): the run log's step list is a compact tree: agents under the agent that called them (Project lead > Design lead > Process engineer ...), each collapsed with its step count and tokens (its own and its helpers'), opening to its steps in order; the agent of the selected step is open. The list is 260 px, scrolls on its own and stays beside the step detail (stacked only under 760 px); labels no longer wrap ("step\n15").

## 1.1.79 (2026-11-05)

- QA-074: while a nested agent works, the chat's tokens and cost come from the larger of the run's usage total and the sum of every finished step (nested agents included), so they grow live instead of showing 0; the collapsed "Steps so far" says how many steps it holds.

## 1.1.78 (2026-11-05)

- QA-088: a study the assistant ran shows in the study list what it found ("Sizing done", "3 runs, 2 feasible", "Best ...") from backend 1.1.80 `GET /design/study/{id}/agent-record`, with Open record (a page with its runs table: verdict and metrics; its sizing table; or its best design) and Open run. Without a record (page studies: 404) the row stays as before.

## 1.1.77 (2026-11-05)

- QA-081 (b): the run stream passes each stored event on once (by its event id), so a reconnect that replays the run from the start no longer counts steps, tool calls and text again (the live counter read 3757 for 261 steps). Live-only events without an id (text deltas, retry) pass as before.

## 1.1.76 (2026-11-05)

- QA-079: an answered question or approval shows once, as its decision line; the steps log no longer repeats it. A request whose answer the chat does not know reads "The assistant asked: ..." instead of "You answered" (a step-limit question left open by a failed run read as answered).

## 1.1.75 (2026-11-05)

- QA-073: the approval card says how to change a proposed value: write the change in "Reason or change" and press Deny; the assistant gets the words and proposes again. Editing the call's values in the card needs the approval answer to carry changed input (backend/geomind).

## 1.1.74 (2026-11-05)

- QA-077: the chat shows Cancel run while either the run's events or the server's run row say the run is not finished (queued, running or waiting); a run whose row stayed waiting after its events ended can be cancelled, so the chat can go on.

## 1.1.73 (2026-11-05)

- QA-075 (Sahand): the run usage panel counts a tool call as failed only when it really failed (the API sends `error: false` for a success; every call showed as failed in red); agents show display names from one shared map (Project lead, Case lead, Geoscientist, ...; else the id in words) in the usage panel, the run panel, the chat's busy lines and the run log; each context ring shows its percent, so it no longer looks like a spinner.

## 1.1.72 (2026-11-05)

- Compare structures: Open and Save as plant on every row (backend 1.1.69 with gemini 0.6.6 stores a plant for every rank); a row turns both off with "Plant not stored for this structure yet" only after a real 404.

## 1.1.71 (2026-11-05)

- Compare structures: Open (the structure's plant in a dialog, backend 1.1.67 `GET /design/study/{id}/structures/{rank}/plant`) and Save as plant (`POST` the same path, saved as the project's next plant version, with a link to the Plant page) on rank 1 and Pareto-front rows; other rows show both disabled with "Plant not stored for this structure yet".

## 1.1.70 (2026-11-05)

- Compare structures (spec evolve-structures-view-2026-11-05): a finished evolve study ("Find the best structure") has a "Compare structures" link that opens a new tab at `/projects/:id/design/study/:study/structures`, from backend 1.1.66 `GET /design/study/{study_id}/structures?limit=10`. The page lists up to 10 unique structures as gemini ranks them (rank, the structure in words, feasible with its reason, the objectives first then the other metrics, the parameters, a "front" mark when there are several objectives); tick 2 or 3 rows to see them side by side with the differing values highlighted. Open and Save per row wait for the backend's plant endpoint.

## 1.1.69 (2026-11-05)

- set_case (geomind 0.4.62, backend 1.1.64): an opened set_case step in the chat fetches its full result and lists `plants_need` as "Plants still need:" (path, message, plants) when there are any.
- The chat's tool cards show the tool view and "The full result is in Runs and logs." only for the tools that have a view (calculate, run_python, web_search, read_web_page, set_case); since 1.1.65 every card showed the note.

## 1.1.68 (2026-11-05)

- QA-067: in a new chat (no messages yet) the Auto-approve toggle switches and shows its state; the first message makes the chat, stores the choice on it, and only then sends, so the first run starts with auto-approve.

## 1.1.67 (2026-11-05)

- Agent tools: when a calculate, run_python, web_search or read_web_page step is opened in the chat, it fetches the call's full output once (backend 1.1.60, `GET /assistant/runs/{run_id}/calls/{call_id}`) and shows the full view (stdout, outputs, search results, page text) as the run log does.

## 1.1.66 (2026-11-05)

- QA-058: the decision lines ("You approved/denied ...: reason", "You answered: ...") come from the run's public `answer` event (backend 1.1.59), so they show in every browser and after a reload; the tab's own memory is kept only as a fallback for runs before that.

## 1.1.65 (2026-11-05)

- Agent tools (spec agent-tools-2026-11-05, section 5): views for `calculate` (label = result with unit, the expression, each operand with its source: case path, assumption, catalogue row with publisher, year, page and link, stored result, earlier calculation, plain number tagged "plain", constant), `run_python` (purpose and status, collapsible code, inputs with sources, stdout, stderr, output files, derived values), `web_search` (source cards: title link, site, date, snippet) and `read_web_page` (title, publisher, author, date, site link, collapsible text, a "more text follows" marker). The run log shows them from the full output. The chat shows them from what its events carry (the call's input, the calculations in the problem state; a calculate step's line reads "label = value unit") and points to Runs and logs for the rest, since a live tool.finished carries only the first 200 characters of the result.
- Approval cards: a run_python approval shows its purpose and the code as code; every http(s) address in "What the call sends" is a link (web citations).

## 1.1.64 (2026-11-05)

- QA-064: the empty Results page reads as one sentence ("No results yet. Run a study to get one."), not three centred lines.

## 1.1.63 (2026-11-05)

- QA-066: every dialog is at most the window's height less 2 rem and scrolls inside, so on a short window (1280x577, or zoom 125-150 %) the New project dialog's title and Create/Cancel stay reachable.

## 1.1.62 (2026-11-05)

- QA-063: a composition stored in a percent unit (`mol%`) shows as stored (CH4 80, total 100 %) instead of x100 (8000); only shares without a percent unit are read as fractions. A long number that is float noise of a short one (0.800000011920929) shows as 0.8.

## 1.1.61 (2026-11-05)

- QA-062: while a run waits for the user, the chat's status line reads "Waiting for your answer below" (not "Thinking"), and the question or approval card scrolls into view when it appears, also after a reload or coming back to the chat.

## 1.1.60 (2026-11-05)

- QA-059: the answer to an assistant's question is a multi-line field that grows with its text (up to 12 rem); Enter makes a new line, Ctrl+Enter (Cmd+Enter) or the Answer button sends.

## 1.1.59 (2026-11-05)

- QA-058: after an approval or a question, the chat shows the decision as a line (You approved "Set case" / You denied "Set case": <reason> / You answered: ...), in the run and in its steps. The tab remembers the answers it sent (sessionStorage); a lasting record for every browser needs the answer in the run's public events.

## 1.1.58 (2026-11-05)

- QA-057: the approval card shows "What the call sends" as a monospace block that keeps the JSON's indentation and wraps long values, and asks with the tool's readable name (Allow "Set case" to change the project?).

## 1.1.57 (2026-11-05)

- QA-048: in a narrow panel (under 44 rem) the Study table leaves out the Kind and Started by columns and wraps the study name, so Result and the row buttons stay in view.

## 1.1.56 (2026-11-05)

- While a run works, the chat lists every working agent (nested ones indented) with a spinning circle (lucide `Loader2`, still under prefers-reduced-motion) left of its name and, right of it, one muted line of what it is doing now (a phrase per tool: "Reading the case", "Asking connector open-meteo", "Searching the web for ...", "Asking the reservoir engineer", "Thinking" with no tool running; an unknown tool by its name in words), cut with an ellipsis and whole in a tooltip; the run panel's agent list marks the same agents. No mark while the run waits for the user, ends or fails.

## 1.1.55 (2026-11-05)

- QA-048: the Study table fits the side panel better: the row buttons read "Start" and "Cancel" (the study name stays in their accessible label) and the Result text wraps anywhere.

## 1.1.54 (2026-11-05)

- QA-031: Auto-approve is stored per chat on the server (backend 1.1.50: GET/PUT `/assistant/chat/{chat_id}/auto-approve`), read when the chat opens and saved on toggle, so the worker approves with no tab open; the browser's old per-project setting is no longer used.

## 1.1.53 (2026-11-05)

- QA-048: a blocked study's row reads "Waits for N values" (the paths open below it, each message as a tooltip) and links to Plant for `params.*` values and to Case for the rest, so the Study table fits the panel.

## 1.1.52 (2026-11-05)

- QA-051: a failure shown in the chat leaves out the tool's input_schema that geomind appends for the agent and is cut at 400 characters; the whole text stays in the step's Output.

## 1.1.51 (2026-11-05)

- QA-053: once an agent's step has finished, the chat shows its whole text at once, so a text paced in word by word can no longer stop mid-word ("I have exhau") when the step ends on a tool call.

## 1.1.50 (2026-11-04)

- QA-040: the plant values sent on save are typed (`[string, ValueUpdate][]`), so the 1.1.49 build compiles again.

## 1.1.49 (2026-11-04)

- QA-040: the Plant page shows a plant-level entry with `options` (backend 1.1.39: `backup`, peak or none) as a select, marks it missing when unset, and saves the choice as `{"value": "<option>"}`; `PlantSearchRange.options` and a string `ValueUpdate.value` added to the API types by hand (contract of backend 1.1.39).

## 1.1.48 (2026-11-04)

- QA-036: a tool step's short summary reads "1 match" (not "1 matche"), and a count read from a cut-off summary shows as at least ("2+ files"), since the last entries are not in the text.

## 1.1.47 (2026-11-04)

- QA-038: an upload on the Case page (Upload CSV for a series, Upload JSON for a file field such as Economics) puts the uploaded file in that field of the draft, so the field keeps its series or file mode and one Save version stores the choice.

## 1.1.46 (2026-11-04)

- QA-019: the run log's step list is wider (300 px), long agent names wrap inside the row and the token count keeps its place inside the card.

## 1.1.45 (2026-11-04)

- QA-033: the Case page's problems box lists each problem once (duplicate keys left stale lines, so the count and the list differed), and a form's "enter a valid value" is left out where the server's check explains the same field.

## 1.1.44 (2026-11-04)

- QA-031: the Auto-approve button says what it does: it approves only while the chat is open in this browser; with the tab closed a run waits. Approving with no tab open needs the backend to know the setting.

## 1.1.43 (2026-11-04)

- QA-030: the chat reads the live `retry` event and shows beside the running step "The model provider is busy (429); trying again in 8 s" (or "trying the next model" for attempt 0) until the run's next event.

## 1.1.42 (2026-11-04)

- QA-029: the API client answers a 429 by waiting its Retry-After (2 s when absent, at most 15 s) and trying again, up to 5 times, so a short rate limit no longer replaces the page with "Rate limit exceeded".

## 1.1.41 (2026-11-04)

- QA-028: the first request of a new project and its file chips are kept in localStorage (was sessionStorage, lost in another tab or a fresh browser context) until the message is sent, and the composer keeps the kept text in step with the user's edits.

## 1.1.40 (2026-11-04)

- QA-025: a run ended by an app restart shows the run's own message in the chat ("The run stopped because the app was updated or restarted; send your message again."), not "internal error in geomind".

## 1.1.39 (2026-11-04)

- QA-027: the run log page fetches the log again every 15 s while the run is queued, running or waiting, so its status, steps and tokens follow the run; it stops once the run ends.

## 1.1.38 (2026-11-04)

- QA-022: an earlier run of a chat that ended without an answer (cancelled or failed) no longer vanishes: under its message the chat offers "Show its steps" (replayed from the run's events) and a link to Runs and logs.

## 1.1.37 (2026-11-04)

- QA-003: the time series chart draws its unit above the plot, so it no longer covers the top tick of the y-axis ("MW0").

## 1.1.36 (2026-11-04)

- QA-005: an answered question in the chat work log keeps its line breaks and reads "You answered this question:"; long decimals in a question (here and on the open question card) are rounded to four significant digits.

## 1.1.35 (2026-11-04)

- QA-001: in the chat, read_case on a project with no case yet shows as done with "No case yet: the assistant builds it from the project's files.", not a red failure asking the user to fill in the Case page.

## 1.1.34 (2026-11-04)

- QA-008: Runs and logs no longer crashes ("n.includes is not a function") on a tool call whose `error` is `true`; the failure text comes from the call's output problem instead.

## 1.1.33 (2026-11-04)

- B12: the coordinator's loop route shows as a short label ("Routed to the project loop") even without `agent`; extra fields like `task` and `preferences` are ignored, so raw route JSON no longer shows as the answer.
- B14: a next-step chip sends the files waiting under the message box with its message, like a typed message, and then clears them.

## 1.1.32 (2026-11-04)

- geomind 0.4.24 tools read well in the run log: list_mcp ("Listed the connectors") and save_mcp_table ("Saved a connector table to the case"); after save_mcp_table or set_case the chat offers Open Case. The per-agent panel takes the run totals from the server, never summed in the browser.

## 1.1.31 (2026-11-04)

- Settings live in one `.env` (was `.env.production`): the Docker build checks for `.env`, `.dockerignore` lets it in, and `.env.example` lists every name (`VITE_API_URL`, `VITE_API_MODE`, `VITE_FEATURE_OPERATION`). On the server: rename `.env.production` to `.env` before the next build.

## 1.1.30 (2026-11-04)

- Chat usage window: one row per agent session of the last run, each with its own context ring (latest call over that model's window, what is left), tokens in and out, cost and its tool calls (open a row to list them), and the run's totals on top. From `GET /assistant/runs/{id}/agents`, refreshed on step, tool and run events. Older servers (404) keep the plain usage view; old logs show "context n/a".

## 1.1.29 (2026-11-04)

- B11: Check on a connector shows each step (server reachable, server answered, sign-in accepted, tools listed) as ok, failed with its reason, or skipped, plus the server name and version when sent and the time taken (backend 1.1.10 `steps`, `server_info`, `elapsed_ms`).
- B7: the "Add to Case" button is gone: backend 1.1.10 saves an accepted chat case and a built plant as the project's next version itself, and the Case and Plant pages refresh when a run ends.

## 1.1.28 (2026-11-04)

- B8: the assistant's question keeps its line breaks, wraps long links and scrolls when long, so the economics question reads one value per line.
- B9: the file viewer shows CSV and TSV as a table (sticky header, wrapped cells), Markdown rendered and JSON pretty-printed.
- B1: files added in New project come with the first chat message as attachments, next to the kept goal.
- B7 (frontend part): "Add to Case" also shows after the assistant set or accepted a case, not only after a saved profile.

## 1.1.27 (2026-11-04)

- Assistant questions with options also take a typed answer ("Or type your own answer"), as geomind 0.4.22 accepts free text; the step-limit question (continue or stop) keeps its options only. Needs the backend release with geomind 0.4.22: older servers answer 422.

## 1.1.26 (2026-11-04)

- JSON editors (Case and the other config pages) open with every field folded; opening a field shows its own fields folded, one level at a time.

## 1.1.25 (2026-11-04)

- Chat box: more room around the text and its placeholder (16px left and top), like Claude's.

## 1.1.24 (2026-11-04)

- Chat: two or three suggested next steps as chips under the last answer (AI Elements Suggestion), from `run.finished.suggestions` live and `message.suggestions` after a reload; a click sends the step's message like a typed one. An empty chat shows `GET /assistant/suggestions?project=[&chat=]`. Contract: geomind contract-suggestions.md v3. Without the backend release nothing shows (a 404 gives no chips).

## 1.1.23 (2026-11-04)

- Chat box: the log button is off for now; the usage ring stays. Each answer still links to its run's log.

## 1.1.22 (2026-11-04)

- Chat box: an Auto-approve switch next to the usage ring. On, the assistant's tool approvals are answered Yes as soon as they show (questions still wait for you); remembered per project in this browser, off until turned on.
- Stop button: after a click it shows a spinner, "Stopping after the current step", until the run ends; a failed stop shows its error.
- After a run that changed the case, plant or a study, buttons under the chat open that page in the side panel (Open Case, Open Plant, Open Study).

## 1.1.21 (2026-11-03)

- Plant: while a pipe is drawn from a port, the ports that fit it get a ring (green for an exact match, amber for a loose one), from backend 1.1.5's `GET /plant/flowsheet/suggest`. Until the server runs gemini 0.6 it answers 501 and nothing is marked; unsaved modules are not suggested.

## 1.1.20 (2026-11-03)

- Chat box: the log button is back next to the usage ring instead of inside its window; the ring's window only shows usage.

## 1.1.19 (2026-11-03)

- Chat usage ring fills with how much of the model's context the last call used, as soon as the server sends `context_window` on `step.started` (asked of the backend); the window shows the share in percent too. Older servers: the ring stays empty as before.

## 1.1.18 (2026-11-03)

- Chat box: a small ring like Claude's replaces the cost text and log icon. It opens what the chat used (context of the last model call, tokens of the last run, cost so far) and a button to the chat's log. The ring fills once the server sends the model's context window size.
- Chat messages: quiet buttons under each message on hover, like Claude's: Copy on every message, the time under yours, and the run's log under answers.
- Plant: the flowsheet is about two thirds of its old height.
- Plant: the module editor opens in a window when a module is clicked (or a problem row, or Edit module next to Add module); the "Select a module" box is gone and the plant's ranges sit under the flowsheet.
- Plant: a Problems panel under the flowsheet like VS Code's: error and warning counts, one row per problem, and a click opens its module. Ready for the server's `warnings` list (out_of_range) and gemini 0.6.1's connection problems with no change.

## 1.1.17 (2026-11-03)

- Run view ready for geomind 0.4.22: rag_search, rag_read and search_knowledge get readable names, an MCP tool (`server__tool`) shows its tool and server, and `tool.started` keeps its `mcp` server (or the older `connector`).
- API paths follow backend 1.1.4: documents are `/workspace/rag`, MCP servers `/workspace/mcp`, the project field `mcp`. The pages keep their names (Knowledge, Library, Connectors).
- Config editor: fields come in the order of the JSON below them (for example Air first on Site), the empty ones after.
- Case tabs in a clearer order: Demand, Site, Utilities, Economics, Requirements, Time.
- Knowledge and Library: a View button next to Delete opens the file in a large window (PDF and images as the browser shows them, text files as text). Uses `GET /workspace/rag/{id}/file` through a blob URL.

## 1.1.16 (2026-11-03)

- Knowledge is now shared documents for the agents' search (RAG): papers, reports, standards and catalogues, the same table, upload and drop box as a project's Library, for every project. It no longer shows the agents' memory; that stays a project setting (Shared memory on or off).

## 1.1.15 (2026-11-03)

- Projects, Knowledge and Connectors share one page layout: the same width, a short title (Projects, Knowledge, Connectors) with a one-line description, and the actions on the right (Knowledge: Import CSV and Add value, greyed out while the server has no memory).
- Scheduled is gone from the sidebar.

## 1.1.14 (2026-11-03)

- Knowledge page (sidebar, no longer "soon"): geomind's shared memory. Values with their source and status, search, Add value (id from the item when empty; source with a page or a link), CSV catalogue import (added, replaced, refused), delete; Past designs open in a window. While the server's geomind has no memory module (`available: false`) the page reads only.
- Connectors page: MCP servers for the agents. Add connector (name of small letters, digits, _ and -; URL; transport; token or key, never shown again), status dot, tools window (read only or asks approval), Check, On, Remove.
- Project settings: an Agents part with Shared memory (on or off) and the connectors the project's runs get. New project asks for Shared memory; nothing is chosen for you.
- The routes are typed by hand in `shared/api/pending.ts` (and `memory`, `connectors` on the project in `schema.d.ts`) until the schema is regenerated from backend 1.1.2; a server without them shows "This server does not offer ... yet".

## 1.1.13 (2026-11-03)

- Config editor everywhere: no columns. Each field takes its own row; a group (such as Ground) opens with a line on its left and its fields indented under it. Under a quantity's name, its value and unit, then Range and Uncertainty, sit behind the same line.
- Project settings open as a window from the project's "…" menu, over the current page. The settings link still works on its own.
- Chat dots in the sidebar: green done, red failed, orange when the run needs your input, blue when it waits for your approval, and a pulsing grey while running.
- User menu with an icon on each item; Theme is one item with a submenu (System, Light, Dark).
- Sidebar: Runs and logs comes last in the project part (Overview, Library, Runs and logs).
- The step tabs in the Design panel title bar no longer show a scrollbar.

## 1.1.12 (2026-11-03)

- Chat: one centred column like a chat app. The message box has + (attach) on the left and, on the right, the cost of the chat so far, a log button and a round send button (a stop button while a run is active). The log button opens a large window with the last run (status, time, tokens, agents), what the assistant knows, and every run of the chat with its tokens and cost. The run column beside the chat is gone.
- The Design panel opens half and half with the chat.
- Plant: the module list is gone from the page; Add module opens a window with the palette, and the picked module lands on the canvas.
- Report: the options column moved into an Options popover next to Export, so the preview takes the whole panel.
- Library: no list of supported formats; an empty Library shows a drop box ("No files yet"), and a drop strip sits under the table. Upload takes several files.
- Overview: the ask box is gone; a short description says what the page shows.
- Sidebar: Connectors (soon) above Knowledge.

## 1.1.11 (2026-11-03)

- Sidebar: the open project has two parts, its pages (Overview, Runs and logs, Library) and then its Chats. Pinned, the project and Chats open and close from their titles. The project's "…" menu holds Pin, Rename and Settings; Project settings left the list.
- Documents is now Library (it holds data files, reports and papers). Knowledge (soon) sits above Scheduled.
- New project dialog, the same everywhere: Start from (Empty case, Copy a case, Project zip), Name, "What do you want to work on?" (it waits in the first chat; nothing is sent until you send it) and a drop zone for context files, which go to the Library.
- Projects page: the search icon opens the main Search dialog.
- One switch style: every toggle is a shadcn Tabs list (design steps, From a file / Fill in here, new project start). The extra toggle components are gone.
- Design pages: titles without numbers; the version (and on Plant the problems) sit next to the title. History is a button next to Save version on Case and Plant and opens in a large window; the Plant page always shows the flowsheet. The Files button is gone for now.
- One config editor for every hand-made JSON config (all Case sections, new study settings): the form is an indented tree, like the JSON itself, and the same JSON shows below as editable text (CodeMirror). Each follows the other; Requirements looks like the other sections.
- Thin scrollbars without a track.

## 1.1.10 (2026-11-03)

- One sidebar everywhere: Geomind and the sidebar toggle at the top; New (opens New project), Search (projects and the chats of the open project), Projects and Scheduled (soon); then Pinned; then the open project with Overview, Runs and logs, Documents, Project settings and its chats; the user menu at the bottom.
- Pin projects (from the card menu) and chats (from the chat menu); pins are kept in this browser.
- Overview, Runs and logs, Documents and Project settings open in the main panel. Case, Plant, Study, Results and Report open in the Design panel next to the chat, switched with toggle buttons in its title bar, each with its progress dot.
- One top bar. The border between chat and Design panel can be dragged and turns blue while dragging.
- Projects page: a search icon opens the search box; a sort icon offers Last updated, Date created and Alphabetical.
- The chat code loads on demand again, so the first page load is smaller.

## 1.1.9 (2026-11-03)

- Laid out like a chat app: the chat is always the main panel and a project opens on it. Case, Plant, Study, Results, Report, Overview, Runs and logs, Documents and Project settings open in a side panel next to the chat, with Expand and Close.
- The sidebar holds New chat, Projects, the pages, the chats of the project (rename and delete from each chat's menu) and the user menu at the bottom. The projects list, account and users open in the main panel with the same sidebar.
- The Plant flowsheet fits a narrow panel: the inspector moves under the canvas when there is no room beside it.

## 1.1.8 (2026-11-03)

- The look is the official shadcn/ui theme: white pages, neutral greys, blue primary, Inter font, shadcn radius and card spacing. Light is the default theme; dark and system stay in the user menu.
- Page titles are bigger with the description under them; pages have more room around them; the top bar and sidebar header are taller.
- Tables of runs, studies, documents, users, history and run totals sit in cards with a tinted header row.

## 1.1.7 (2026-11-03)

- Every page and panel shows loading the same way (shadcn Spinner with the same text).

## 1.1.6 (2026-11-03)

- Charts use shadcn Charts (Recharts): the time series on the Case page has a tooltip with the date and value; the Compare scatter has round tick values, spread bars and a label on every design. Progress bars are shadcn Progress. The days-covered strip stays a small SVG (no chart library draws a calendar grid).

## 1.1.5 (2026-11-03)

- The Plant module palette is shadcn Command: type to filter, arrow keys and Enter to add, or drag onto the canvas as before. Sub-plants are their own group at the end.

## 1.1.4 (2026-11-03)

- Chat uses AI Elements (Conversation, Message): the conversation scrolls in its own box and follows new messages, with a button back to the newest one; the sent message sits on the right.
- The message box is a shadcn Input Group with a growing text area: Enter sends, Shift+Enter starts a new line; attach, Cancel run and Send sit under it.

## 1.1.3 (2026-11-03)

- Forms use shadcn Field and FieldLabel; every drop-down is shadcn Native Select (still a native select, so keyboard and phone pickers work as before).
- Loading, empty and error panels use shadcn Spinner, Empty and Alert. The hand-written Field component is gone.

## 1.1.2 (2026-11-03)

- Every table (runs, studies, documents, users, history, results, chat alternatives, Markdown) uses shadcn Table; the hand-written scroll wrapper is gone.

## 1.1.1 (2026-11-03)

- Project sidebar is shadcn Sidebar: it collapses to icons (button left of the breadcrumb, or Ctrl/Cmd+B) with tooltips, and opens as a side sheet on phones. The project name and Switch project sit at its top.
- Breadcrumb is shadcn Breadcrumb.

## 1.1.0 (2026-11-03)

- shadcn/ui (Radix underneath) is the component base, in `src/components/ui`. Buttons, cards, dialogs, badges, tabs, inputs, menus and toasts on every page now use it; the hand-written versions in `shared/ui` are gone.
- Toasts use Sonner; cards keep their action (link or badge) on the title row.
- React 19.

## 1.0.1 (2026-11-03)

- Removed the Editor page and everything only it used (its route, sidebar link, Overview button, the plant embed option, the outline of changed modules and the plant version choice in New study). The work now goes into a better structure for the existing pages.

## 1.0.0 (2026-11-03)

- Editor page (`/projects/<id>/design/editor`): plant, chat, studies and results on one screen; side panel with Chat and Inspect; results drawer; study toolbar with progress and Cancel.
- Run mode: the plant is read-only while a study runs; each module's capacity after it; studies on a chosen plant version (backend 1.0.0, hidden on older backends).
- The modules another author, such as the agent, changed are outlined on the canvas, with a notice and Show history.
- Chat: design alternatives with verdicts and the recommended design; readable text for tool problem codes and stop reasons.
- Phones: the plant is read-only, with the chat below it.
