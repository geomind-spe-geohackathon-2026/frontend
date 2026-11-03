# Changelog

The frontend uses semantic versions (v1.x.y). It talks to backend contract 1.0.0 and later.

## 1.1.17 (2026-11-03)

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
