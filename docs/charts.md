# Chart layer

Choice: shadcn Charts (`src/components/ui/chart.tsx`, Recharts underneath) for every chart Recharts can draw, and shadcn Progress for progress bars. Sahand's rule: use open-source components before writing our own.

- Colours are the design tokens: each chart's `ChartConfig` names `var(--accent)`, `var(--muted)` and so on, so charts follow the light and dark themes.
- Each chart sits in a `ChartContainer` with `role="img"` and an `aria-label` that states what a reader would take from it.
- Recharts draws its axes after it measures its box, so unit tests check the text alternative and the summary, not axis text. Check axes in the browser.

The one exception is the days-covered strip: a calendar grid of 365 coloured cells is not a Recharts chart type, so it stays a small SVG.

Rules for chart code (owner: C8): values come from the API with their unit; no hard-coded series names or ranges; axis titles show the unit; a missing series is shown with `<Missing>`, not drawn as zero.

The flowsheet is not part of this layer: it uses `@xyflow/react` with `elkjs` (owner: C7).

## What exists (C8)

All in `src/shared/charts/`:

- `scale.ts`: `toLinearScale`, `toNiceTicks`, `toPaddedDomain`. Charts use them for nice tick values.
- `time-series-chart.tsx`: `TimeSeriesChart`. shadcn Chart line over time with date ticks (`time-ticks.ts`), a tooltip with the date and value, and summary chips (peak, lowest, mean, energy).
- `scatter.tsx`: `Scatter`. shadcn Chart scatter with axis titles that carry the unit, spread bars (Recharts `ErrorBar`), each design labelled, a dashed line through the Pareto set, and the best trade-offs named in the `aria-label`.
- `progress-bar.tsx`: `ProgressBar`. shadcn Progress in percent. A `null` value draws an indeterminate bar with no `aria-valuenow`. Studies stay `0 of 1` until they end, so the Study page uses this for running studies instead of a percentage.
- `days-strip.tsx`: `DaysStrip` (SVG, see above). One cell per day on a week grid, coloured by source (geothermal `--ok`, backup `--gas`, short `--bad`); legend with day counts as text and the same counts in the `aria-label`. Pages show "not available" when `coverage` is `null`; they never draw an empty strip.

`shared/ui/notice.tsx` (`Notice`) is the shared loading, empty, error and permission (403) panel used by the C8 pages; it is built from shadcn Spinner, Empty and Alert.
