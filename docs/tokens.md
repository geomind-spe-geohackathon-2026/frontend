# Design tokens

Source: the mockup (`../docs/ui-mockup.html`). Defined in `src/styles/index.css` as role-named CSS variables, exposed to Tailwind through `@theme inline` (`bg-surface`, `text-muted`, `border-border`, `text-ok`, `bg-warn-soft`, `text-hot`, `rounded-card`, `shadow-float`). Tailwind's default colour palette is switched off: only these roles exist.

shadcn/ui components use their own names (`primary`, `muted-foreground`, `card`, `destructive`, `ring`, `sidebar-*`, `chart-1`…`chart-5`, `--radius`). `@theme inline` maps each of these to one of our roles (for example `primary` -> `accent`, `destructive` -> `bad`, `chart-1` -> `heat`), so copied components follow the theme without edits.

| Role | Light | Dark | Use |
|---|---|---|---|
| `background` | `#ffffff` | `#0a0a0a` | page |
| `surface` | `#ffffff` | `#171717` | cards, inputs, menus |
| `sidebar` | `#fafafa` | `#171717` | sidebar |
| `sunken` | `#f5f5f5` | `#262626` | code, hover, table header |
| `border` | `#e5e5e5` | `#2e2e2e` | borders |
| `text` | `#0a0a0a` | `#fafafa` | text (`text-text`) |
| `muted` | `#737373` | `#a1a1a1` | secondary text |
| `accent`, `accent-soft`, `on-accent` | `#2563eb`, `#eff6ff`, `#fff` | `#3b82f6`, `#172554`, `#fff` | links, primary, active |
| `ok`, `warn`, `bad` (+ `-soft`) | green, amber, red | brighter | done, missing or waiting, blocked or danger |
| `hot` | `#d0542b` | `#ee7a50` | brine (geothermal water) |
| `heat` | `#e0912f` | `#f0ab55` | heating water |
| `cold` | `#2f74c9` | `#6aa6ec` | chilled water |
| `gas` | `#7c8a96` | `#9aa8b4` | gas |
| `power` | `#7a5bc0` | `#a78be6` | electricity |

Neutral colours are the official shadcn/ui neutral theme; the primary is blue. Themes: light by default, system (`prefers-color-scheme`) or explicit light or dark through `data-theme` on `<html>`, chosen in the user menu and remembered in local storage (`shared/layout/theme.ts`, applied before the first render). CSS cannot share one block between the media query and the attribute, so the dark values appear twice; `tests/rules/tokens.test.ts` fails when they differ.

Type: Inter (variable) and IBM Plex Mono (400, 500), self-hosted through `@fontsource` (no CDN). Body 14 px, line height 1.45; h1 26 px semibold, h2 16, h3 13 px. Tables use tabular figures; `Quantity` sets `tabular-nums`.

Shape: shadcn radius (`--radius` 0.625 rem; `sm`/`md`/`lg`/`xl` derive from it); `control` = `md`, `card` and `dialog` = `xl`, `pill` 99 px. Cards keep the stock shadcn padding and `shadow-sm`. A card that holds only a table uses `tableCardClass` (`shared/ui/table-card.ts`). Focus ring: 2 px accent outline, 1 px offset.

Rules: never encode meaning by colour alone (stream colours, chips and the missing marker also carry text or an icon); `Quantity` renders every number with its unit, `Missing` renders an absent value with the word "missing" and what it blocks.
