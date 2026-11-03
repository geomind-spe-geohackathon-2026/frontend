# Editor

The app is a small editor for geothermal heating and cooling plants: modules are dragged onto a canvas and connected, an agent in the chat helps, and studies simulate and optimise the plant. The Editor page (`/projects/<id>/design/editor`) puts these on one screen. The Case, Plant, Study, Results and Chat pages stay as they are, so the form-based mode keeps working.

```
┌ toolbar: latest study and its progress · Run study · Chat · Results ──────────────┐
│ plant: palette │ canvas │ inspector              │ chat dock: chats, conversation │
├ results drawer: one tab per result, Compare ──────────────────────────────────────┤
└───────────────────────────────────────────────────────────────────────────────────┘
```

The page lives in `src/app/editor/`, because the app layer is the only place that may compose several features (`docs/conventions.md`, section 2). It reuses the feature components as they are: `PlantPage`, `ChatWorkspace`, `NewStudyDialog`, `ResultPane` and `ComparePane`. Chat keeps `useRunView` and `Blocks`, so streaming and pacing carry over.

## Tasks

Status: done, next, or blocked (with what it waits for).

| # | Task | Status |
|---|---|---|
| E1 | Editor page: route `design/editor`, first item of the Design group in the sidebar, a full-height frame with the plant on the left, a chat dock on the right and a results drawer at the bottom. Below 1000 px the parts stack. | done |
| E2 | Toolbar: the latest study with its progress bar, Cancel while it runs, and Run study, which opens the New study dialog. When a study ends, the results drawer opens. | done |
| E3 | Chat dock: the newest chat, or the one named by `?chat=`, a chat picker and New chat. A new chat stays in the dock and does not leave the editor. | done |
| E4 | Results drawer: one tab per result and Compare, opened and closed from the toolbar; the open panels are in the address (`?panels=chat,results`). | done |
| E5 | Editor as the project's start page: Overview has Open editor. | done |
| E6 | Embedded plant: `PlantPage` takes `embed` (context in `design/plant/embed.ts`); embedded, it drops its page title and keeps only the actions row, so the canvas gets more room. Agreed with the UX thread. | done |
| E7 | Right panel tabs, Chat and Inspect: the module inspector is portalled into the Inspect tab; selecting a module (on the canvas, in the result strip, or by `?module=`) opens it. When the side panel is closed, the inspector stays under the canvas as on the Plant page. It is read-only while the plant is locked. | done |
| E8 | Agent edits: the plant already reloads when a run ends (`useRunView` refreshes the project). The editor now says when someone else, such as the agent, saved a plant version, with Show history. Still to do: outline the changed modules on the canvas. | partly done |
| E9 | Run mode: while a study runs the plant is read-only (inert, with a notice); after it ends a strip shows each module's key result (capacity, share used) from the newest result, and a click selects the module. Numbers drawn on the canvas nodes wait for E6. | done |
| E10 | Stream values on connections (flow, temperature) after a run. | blocked: results have no per-connection values; on the list for Sahand to ask gemini |
| E11 | Readable chat endings for the stop codes `no_case` and `case_incomplete`: `tool.finished` carries `problem` (contract version 50), shown by `toFailureText` and at the end of a failed run. | done |
| E12 | Report diagram: lines between Treatment and Heating crossed. Already worked on in dev (ffd7673, `shared/plant/flowsheet-layout.ts`); left to the visual check on production below, so the two changes do not collide. | handed to the visual check |
| E13 | Phones (below 640 px): the plant is read-only with a notice, and the chat sits below it; editing stays on larger screens. | done |

Visual checks still to do on production (handed over from the backend thread): the report diagram, Plant zoom in the competition project, wide report tables on a phone, Compare labels with several designs, Days covered in the dark theme, and Plant section unit conversion.
