# Frontend F5: Well performance

## Goal

The three analysis pages: nodal analysis, injectivity analysis and pump performance.

## Context

- Follow the shared rules in `../docs/phases.md` (section "Rules for every phase") and the contracts in `../docs/contracts.md`.
- Needs F4 and the `performance` routes in `contracts.md` (mock them until B4 is done).
- Read `../docs/feature-map.md`, domain Well Performance, and the legacy entries P08, P09, P10.

## Layout

```
src/domains/performance/  nodal  injectivity  pump
```

## Steps

Each page has the same shape: choose the equipment, check the inputs (filled from the plant model, editable for what-if), run as a long job, see the chart and the numbers.

1. **nodal:** IPR and VLP curves with the operating point; what-if on pump frequency and wellhead pressure.
2. **injectivity:** Hall plot with derivative (linear and log-log); Q-P plot with skin lines.
3. **pump:** monitor tab (manufacturer curves per frequency with measured points; flow and frequency over time) and calibrate tab (run, factors, before and after charts, save).

Same chart wrapper as F4; units on every axis and the same units across related charts (the legacy pump charts mixed bar and metres).

## Done when

- The three pages work on the example data.

## Report back

What was built, contract issues, and screenshots.
