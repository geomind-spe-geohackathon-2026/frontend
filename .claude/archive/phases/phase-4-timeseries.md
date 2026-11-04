# Frontend F4: Time series

## Goal

Look at plant data: dashboard, trends, data sources and import, data availability, and soft sensors.

## Context

- Follow the shared rules in `../docs/phases.md` (section "Rules for every phase") and the contracts in `../docs/contracts.md`.
- Needs F1 and the `timeseries` routes in `contracts.md` (mock them until B3 is done).
- Read `../docs/feature-map.md`, domain Time Series, and the legacy entries P04, P06, P14, P15.

## Layout

```
src/domains/timeseries/  dashboard  trends  sources  availability  softsensors
src/shared/charts/       one Plotly wrapper with the app theme and units on axes
src/shared/longjob/      one hook for long jobs: progress, timeout, cancel
```

## Steps

1. **dashboard:** the plant dashboard (Grafana embed through the backend's URL).
2. **trends:** pick tags and a time range; multiple tags on one chart with shared or separate axes by unit.
3. **sources:** historian connection form (secrets write-only), intervals, CSV import with the expected columns shown before upload.
4. **availability:** a timeline of first and last data per tag.
5. **softsensors:** run now, see job progress, see the last run.

All times are shown in the user's timezone and sent as UTC.

## Done when

- A CSV is imported, plotted, its availability shown, and soft sensors computed.

## Report back

What was built, contract issues, and screenshots.
