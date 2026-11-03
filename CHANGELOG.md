# Changelog

The frontend uses semantic versions (v1.x.y). It talks to backend contract 1.0.0 and later.

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
