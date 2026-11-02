# Design tokens

Source: the mockup (`../docs/ui-mockup.html`). Defined in `src/styles/index.css` as role-named CSS variables, exposed to Tailwind through `@theme inline` (`bg-surface`, `text-muted`, `border-border`, `text-ok`, `bg-warn-soft`, `text-hot`, `rounded-card`, `shadow-float`). Tailwind's default colour palette is switched off: only these roles exist.

| Role | Light | Dark | Use |
|---|---|---|---|
| `background` | `#eef1f4` | `#0f151b` | page |
| `surface` | `#ffffff` | `#17202a` | cards, inputs, menus |
| `sunken` | `#e7ebef` | `#0c1116` | sidebar, code, hover |
| `border` | `#d3dae1` | `#293643` | borders |
| `text` | `#17212b` | `#e2e8ee` | text (`text-text`) |
| `muted` | `#5b6977` | `#91a0ae` | secondary text |
| `accent`, `accent-soft`, `on-accent` | `#0f6e84`, `#dbecf0`, `#fff` | `#4fb3c9`, `#15343d`, `#0c1116` | links, primary, active |
| `ok`, `warn`, `bad` (+ `-soft`) | green, amber, red | brighter | done, missing or waiting, blocked or danger |
| `hot` | `#d0542b` | `#ee7a50` | brine (geothermal water) |
| `heat` | `#e0912f` | `#f0ab55` | heating water |
| `cold` | `#2f74c9` | `#6aa6ec` | chilled water |
| `gas` | `#7c8a96` | `#9aa8b4` | gas |
| `power` | `#7a5bc0` | `#a78be6` | electricity |

Themes: system by default (`prefers-color-scheme`), explicit light or dark through `data-theme` on `<html>`, chosen in the user menu and remembered in local storage (`shared/layout/theme.ts`, applied before the first render). CSS cannot share one block between the media query and the attribute, so the dark values appear twice; `tests/rules/tokens.test.ts` fails when they differ.

Type: IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500), self-hosted through `@fontsource` (latin subset, no CDN). Body 14 px, line height 1.45; h1 20, h2 16, h3 13 px. Tables use tabular figures; `Quantity` sets `tabular-nums`.

Shape: radius `control` 6 px (inputs, buttons), `card` 8 px, `dialog` 10 px, `pill` 99 px. Shadow only on menus, dialogs and toasts. Focus ring: 2 px accent outline, 1 px offset.

Rules: never encode meaning by colour alone (stream colours, chips and the missing marker also carry text or an icon); `Quantity` renders every number with its unit, `Missing` renders an absent value with the word "missing" and what it blocks.
