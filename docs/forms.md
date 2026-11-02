# Forms from JSON schema (`src/shared/forms`)

One entry point generates a form from gemini's JSON schema, with units, missing marks and ajv checks. The case (Problem page), the module parameters (Plant page) and, for C8, the study settings use it.

```tsx
<SchemaForm
  schema={schema}            // JSON schema (a whole document or one section)
  initial={value}            // starting value; read once, reset the form with a new `key`
  onChange={(value, problems) => ...}   // every change: pruned value and ajv problems
  prefix="site"              // optional: where this subtree sits in the whole document
  missing={["site.ground.gradient"]}    // optional: missing paths from the server (full paths)
  problems={[{ path, message }]}        // optional: server problems (full paths)
/>
```

The parent owns the value. It keeps what `onChange` reports, compares it with the saved document with `isEqualDocument` (empty parts and key order ignored) to know if it is dirty, and resets the form by changing `key` (after a save or a discard). Never copy server data into form state.

## What the schema drives

- A quantity is an object with `value` and `unit` properties: a number input and a unit select (or a fixed unit label). Typing the first value sets the unit to the first one the schema lists; no value is ever invented.
- A scalar with a `unit` string (module parameters) shows the unit next to the label.
- Strings, numbers, integers, booleans and enums become the matching control. Clearing a number removes the value.
- Objects become fieldsets, lists of objects get add and remove buttons, `anyOf`/`oneOf` picks the alternative that fits the value (a file reference of a series is shown read only).
- Free objects (`{type: "object"}` with no properties) are not drawn and are kept as they are.
- Labels come from `title` or the humanised property name.

## Missing is not invalid

`required` properties without a value are marked "missing" (client side by `findMissing`, plus the paths the server sends in `missing`). They never block saving by themselves: the resolver ignores ajv's `required` errors. Wrong types, units outside the enum, bounds and unknown values are problems, shown next to the field (`aria-invalid`, linked with `aria-describedby`) and returned to the parent, which disables Save.

## Other pieces

- `createSchemaResolver(schema)`: the react-hook-form resolver (nested errors under the form root `v`); `validateDocument(schema, value)` is the same check as a plain function.
- `sectionsOf(schema)`: the top-level properties that are objects or lists, the tabs of the Problem page. No fixed list anywhere.
- `useUnsavedGuard(dirty)` + `UnsavedChangesDialog`: router blocker and `beforeunload`.
- `ConflictDialog`: the 409 prompt (reload or keep editing). `NoteDialog`: the note of a new version. `LoadError`: error and permission (403) state. `useDebouncedValue`: for debounced server validation.
- Fixture for tests and mocks: `example-schema.ts`.
