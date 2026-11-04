# Frontend F3: Plant model

## Goal

Build and edit the plant model in the browser: flowsheet, equipment parameters, tag bindings and the equipment catalogue.

## Context

- Follow the shared rules in `../docs/phases.md` (section "Rules for every phase") and the contracts in `../docs/contracts.md`.
- Needs F1 and the `plant` routes in `contracts.md` (added by B3 before it starts; mock them until B3 is done).
- Read `../docs/feature-map.md`, domain Plant Model, and the legacy frontend entries P05, P13, P14 for behaviour to keep and bugs not to copy.

## Layout

```
src/domains/plant/  flowsheet  parameters  bindings  catalogue
```

## Steps

1. **flowsheet:** React Flow canvas; palette from the API (gemini modules by category); ports and stream types from module metadata, incompatible connections refused; save with a note, discard, history, start from the example; unsaved-changes warning.
2. **parameters:** forms generated from module metadata (units, bounds, validation); date selector for versions; trajectory and tally upload with a preview table; review as on a date.
3. **bindings:** for each module variable, pick a tag; versions by date.
4. **catalogue:** an editable table (TanStack Table); add, edit, remove; "fill from catalogue" in the parameters form. Do not use DataTables Editor.

## Done when

- The example doublet can be drawn, parametrised, bound and saved, and its history browsed.

## Report back

What was built, contract issues, and screenshots.
