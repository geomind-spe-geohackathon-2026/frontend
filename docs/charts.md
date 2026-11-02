# Chart layer

Choice: hand-written SVG components in `src/shared/charts/`, no charting library.

Why:

- The mockup needs four simple charts: a daily demand line chart (two series, 365 points), a days-covered strip (365 coloured cells with a legend), a scatter with a Pareto line, and a progress bar. Each is a few dozen lines of SVG.
- Colours must be the design tokens (`var(--heat)`, `var(--cold)`, `var(--ok)`), so they follow the light and dark themes. A library needs its colours passed in and re-themed; SVG takes CSS variables directly.
- No dependency weight (Recharts with D3 adds roughly 100 kB gzipped to a 130 kB app) and no library API to learn or to upgrade.
- Accessibility is easier to get right by hand: each chart is an `<svg role="img">` with a title, a text alternative and a legend, and the days-covered strip also has a table or text summary.
- Tests can assert on the SVG a user sees (paths, cells, labels).

Cost: axes, ticks and scales are ours. Keep them in one small module (a linear scale and a "nice ticks" function) inside `shared/charts/` and reuse it in all charts.

Rules for chart code (owner: C8): values come from the API with their unit; no hard-coded series names or ranges; axis titles show the unit; a missing series is shown with `<Missing>`, not drawn as zero.

The flowsheet is not part of this layer: it uses `@xyflow/react` with `elkjs` (owner: C7).
