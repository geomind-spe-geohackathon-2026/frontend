# Frontend conventions

Stack: Vite, React 18, TypeScript strict, Tailwind, shadcn/ui, React Router (data router), TanStack Query, react-hook-form + ajv, MSW, Vitest + Testing Library, Playwright.

Sources read: react.dev (Thinking in React, Keeping Components Pure, You Might Not Need an Effect, Rules of Hooks, Choosing the State Structure, Sharing State, Custom Hooks), the TypeScript `strict` reference, typescript-eslint configs, TanStack Query (query keys, query options, invalidation, optimistic updates, suspense), React Router data routing, bulletproof-react project structure, Testing Library guiding principles, react-hook-form `useForm`, MDN accessibility basics. The Testing Library query-priority list below is from general knowledge: the guiding-principles page does not contain it.

## 1. Project rules

1. General, never competition-specific. Hackathon numbers, names, temperatures, prices or limits appear only in test fixtures and MSW mock data, in files and variables named as examples (`example-*`).
2. No default values for engineering or economic inputs, in code, forms or UI. A missing value is shown by `<Missing>` (warning colour, the word "missing", what it blocks). Technical settings (page size, debounce ms, timeouts) may have defaults.
3. gemini is the source of truth for physics names, units, schemas and checks. Use its names. Never hard-code a section list, module list or unit list; read them from the API.
4. I/O functions are named `from<Format>` / `to<Format>`: `fromCsv`, `toJson`, `fromEvent`. Never `parseX`, `loadX`, `exportX`, `serialize`.
5. Folders: one word, lower case, no hyphens or underscores (`assistant/chat`, `design/case`).
6. English only: code, UI, docs, commits.
7. No comments in code. The only allowed text is a one-line JSDoc directly above an exported function or component, and `// eslint-disable-next-line <rule>` whose reason is in that JSDoc. A test enforces this.
8. Nesting at most 3 levels; functions about 40 lines at most; guard clauses; full-word names; no clever one-liners; no dead code, unused exports or speculative options.
9. Every bug fix starts with a failing test. No network and no real LLM in tests.

```ts
/** Converts a CSV text of a series file into points. */
export function fromCsv(text: string): Point[] {
  if (text.trim() === "") return [];
  return text.trim().split("\n").map(toPoint);
}
```

## 2. Folder layout and imports

```
src/
  components/ui/   shadcn/ui components (new-york style), copied in as source
  app/      router, layouts, providers, auth guard, error boundary
  domains/<domain>/<feature>/   pages, components, api.ts, hooks, tests
  shared/   ui, api, sse, forms, charts, quantity, layout
  mocks/    MSW handlers (one file per domain), fixtures
  lib/
```

Direction is one way: `components` -> `shared` -> `domains/*/*` -> `app` (bulletproof-react).

- Use an open-source component before writing one. The base is shadcn/ui: its components live in `src/components/ui` as copied source (see `components.json`), with Radix underneath. Add a new one from the shadcn registry (`apps/v4/registry/new-york-v4/ui` on GitHub) instead of writing it by hand. Keep edits to these files small: colours go through the token aliases in `docs/tokens.md`.
- `components` imports only `components` and `lib`. Lint relaxes some rules there because the code is upstream's.

- `shared` imports nothing from `domains` or `app`.
- A feature imports only from `shared` and from itself. Never from another feature, not even a type. If two features need it, move it to `shared`.
- `app` composes features (routes). Features do not know about routes beyond their own links.
- Import files directly, no barrel `index.ts` files.
- Enforced by `tests/rules/boundaries.test.ts` (layer rules, one feature never imports another, no barrels). A broken rule fails `npm run check`.

## 3. TypeScript strict

`tsconfig.json`:

```json
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true, "noImplicitOverride": true, "noFallthroughCasesInSwitch": true } }
```

`strict` turns on `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `useUnknownInCatchVariables` and the rest of the family. `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are not part of `strict`; we add them.

ESLint (flat config) uses typed linting with both configs:

```js
extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
languageOptions: { parserOptions: { projectService: true } }
```

Rules:

- No `any`, no `as` casts to silence errors, no `!` non-null assertion. Narrow instead. Data from outside (JSON, SSE, `catch`) is `unknown` until validated.
- API types come from `openapi-typescript` (`npm run gen:api`); never hand-write a type the backend already has.
- Model states as discriminated unions, not booleans: `type Load = { status: "idle" } | { status: "ok"; data: Plan } | { status: "failed"; error: ApiError }`.
- `switch` over a union ends with an exhaustive `never` check.
- `import type` for types. Prefer `type` aliases for data, `interface` only for extendable object contracts.
- `eslint-plugin-react-hooks` is on at error level (`rules-of-hooks`, `exhaustive-deps`). Never disable `exhaustive-deps`; fix the design.

## 4. React

Thinking in React: split the UI into components that each do one thing, build a static version from props, find the minimal state, put it in the closest common parent, add callbacks for inverse data flow.

Pure components. Same props, state and context give the same JSX. Do not mutate props, state, or module variables while rendering; copy first (`items.toSorted()` or `[...items].sort()`, never `items.sort()`). Local objects created in render may be mutated. Side effects go in event handlers. StrictMode runs components twice in development; keep it on.

State structure:

- Store the minimum. Anything computable from props or state is computed in render, not stored and not synced with an Effect.
- Store an id, not a copy of the object: `const selected = items.find(i => i.id === selectedId) ?? null`.
- One `status` value instead of contradicting booleans.
- Group values that change together; keep state flat (map by id, children by id) rather than deeply nested.
- Lift state to the closest common parent; each piece of state has exactly one owner. Server data is not component state: it lives in TanStack Query.
- Controlled components for anything the parent must coordinate; uncontrolled for purely local UI.

You might not need an Effect. Effects only synchronize with external systems (WebSocket/SSE, DOM widgets, timers).

```tsx
const fullName = `${first} ${last}`;
<Editor key={projectId} projectId={projectId} />
function handleSave() { save.mutate(values); }
```

- No Effect to derive state, to react to a click, to chain state updates, or to pass data up to a parent.
- Reset a component's state when identity changes with `key`, not with an Effect.
- Subscribe to browser stores with `useSyncExternalStore`.
- Fetching is TanStack Query, never `useEffect` + `fetch`. SSE subscriptions are an Effect inside one custom hook with a cleanup that aborts.
- `useMemo`/`useCallback` only after measuring.

Hooks: call at the top level, never in conditions, loops, try/catch, nested functions or after an early return; only in components and custom hooks.

Custom hooks: name starts with `use` and calls at least one hook (otherwise it is a plain function: `getSorted`, not `useSorted`). Extract repeated stateful logic and Effects with a focused purpose (`useRunStream(runId)`). Hooks do not share state between callers; lift state for that. No `useMount`/`useEffectOnce` wrappers.

Components: named function exports, one component per file when exported, props typed with a local `type Props`. Event props are `onX`, handlers are `handleX`. Render lists with stable ids as `key`, never the index for reorderable data. Markdown is rendered without raw HTML.

Every screen implements loading, empty, error and permission states. Numbers are rendered with `<Quantity value unit />`; absent values with `<Missing what blocks />`.

## 5. TanStack Query

Keys are arrays, serializable, unique to the data, and include every variable the query function uses. Build them in one factory per feature, hierarchical from general to specific:

```ts
export const studyKeys = {
  all: (projectId: string) => ["projects", projectId, "studies"] as const,
  list: (projectId: string, filter: StudyFilter) => [...studyKeys.all(projectId), "list", filter] as const,
  detail: (projectId: string, studyId: string) => [...studyKeys.all(projectId), "detail", studyId] as const,
};
```

Query options factories (`queryOptions`) are the only way to declare a query; hooks, loaders, `prefetchQuery` and `setQueryData` all use the same factory:

```ts
export const studyQuery = (projectId: string, studyId: string) =>
  queryOptions({
    queryKey: studyKeys.detail(projectId, studyId),
    queryFn: ({ signal }) => getStudy(projectId, studyId, signal),
  });

const study = useQuery(studyQuery(projectId, studyId));
const name = useQuery({ ...studyQuery(projectId, studyId), select: (s) => s.name });
queryClient.setQueryData(studyQuery(projectId, studyId).queryKey, updated);
```

- `api.ts` of a feature holds its key factory, options factories and mutation hooks. Components never call `fetch` or the client directly.
- Pass `signal` to the client so cancelled queries abort.
- Set `staleTime` per factory when data rarely changes; the global default stays small and explicit.
- Never copy query data into `useState`. Derive with `select` or in render.
- Pagination uses `?cursor=` with `infiniteQueryOptions`.

Mutations and invalidation: invalidate by key prefix and return the promise so the mutation stays pending until fresh data is in.

```ts
useMutation({
  mutationFn: (input: NewStudy) => createStudy(projectId, input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: studyKeys.all(projectId) }),
});
```

Optimistic updates: prefer the simple form, rendering `variables` of a pending mutation (`isPending`, `variables`), when one place shows it. Use the cache form only when several places show the data:

```ts
onMutate: async (next) => {
  await queryClient.cancelQueries({ queryKey: key });
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, (old) => apply(old, next));
  return { previous };
},
onError: (_error, _next, context) => queryClient.setQueryData(key, context?.previous),
onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
```

Plant and case saves are not optimistic: they are versioned, the backend is the authority, and a 409 shows a reload prompt.

Suspense vs status flags: pick one style per screen.

- Status flags (`isPending`, `isError`, `data`) when the screen needs its own loading, empty and error states inline, or when a query is conditional (`enabled`). This is the default.
- `useSuspenseQuery` with `<Suspense>` and an error boundary (reset through `QueryErrorResetBoundary`) for page-level data that must exist to render; `data` is never undefined. Wrap key-changing updates in `startTransition` to avoid flashing the fallback.
- Never mix `isPending` checks into a `useSuspenseQuery` component.

Errors from the client are a typed `ApiError`; show its code and message, never a raw exception.

## 6. React Router

Use the data router: `createBrowserRouter` and `RouterProvider`, defined once in `app/router.tsx`, with nested routes and pathless layout routes rendering `<Outlet />`.

```tsx
createBrowserRouter([
  { path: "/signin", Component: SignInPage },
  {
    Component: AuthGuard,
    children: [
      { Component: HomeLayout, children: [{ path: "/projects", Component: ProjectsPage }] },
      {
        path: "/projects/:projectId",
        Component: ProjectLayout,
        children: [{ path: "overview", Component: OverviewPage }],
      },
    ],
  },
]);
```

- Three layout levels: sign-in (no chrome), home (top bar), project (top bar + sidebar). Layouts own chrome and `<Outlet />`; pages own content.
- Route-level code splitting with `lazy`.
- Loaders only where they help: guards that must redirect before render, and warming the cache with `queryClient.ensureQueryData(sameQueryOptions)`. Loaders never hold data that components fetch separately, and component data is read with `useQuery`, not `useLoaderData`, so there is one cache.
- Protected routes: one `AuthGuard` layout route. Without a session it redirects to `/signin` and remembers the target in the URL, to return after sign-in. Role checks (admin-only `/users`) use the same pattern in a second layout route. The backend still enforces permissions.
- Unknown project id: redirect to `/projects` with a message.
- Read params with `useParams` and validate them; a missing param is an error, not `""`.
- State that should survive reload or be shared by link (selected tab, filter, selected result) goes in the URL (path or search params), not in `useState`.
- Unsaved-changes guard uses the router blocker, not `window.confirm`. No `window.confirm` or `alert` anywhere; use in-page dialogs.

## 7. Forms (react-hook-form + ajv)

Forms for the case and for module or study settings are generated from the JSON schema supplied by the API; sections, fields, units and titles come from the schema, never from a hard-coded list.

- One resolver in `shared/forms`, built on ajv, that implements react-hook-form's `Resolver` and returns `{ values, errors }` with nested error objects (`a.b[1].c` becomes nested, not a flat dotted key). Features do not write their own validation.
- Do not mix the resolver with built-in `required`/`min` rules; the schema is the only source of rules.
- No `defaultValues` invented for engineering or economic fields. `defaultValues` come from the saved document; absent fields stay absent and are marked missing. Never use `undefined` placeholders that turn into `0`, `""` or `false`.
- `mode: "onTouched"` (validate on first blur, then on change). Server validation (debounced `validate` call) runs in addition and its problems are mapped onto fields with `setError`.
- `reset(saved)` after a successful save so `isDirty` is correct; drive the unsaved-changes guard from `isDirty`.
- Every number input shows its unit next to the label; values stay in the unit gemini names.

## 8. Accessibility

- Use the native element: `button` for actions, `a`/`Link` for navigation, `input`/`select`. Never a clickable `div`. shadcn/Radix primitives are used for dialogs, menus, tabs and tooltips because they handle focus and keys.
- Every input has a visible `<label>` (`htmlFor`/`id` or wrapping); placeholders are not labels. Icon-only buttons get `aria-label`. Errors are linked with `aria-describedby` and `aria-invalid`, announced by a live region.
- Keyboard: everything reachable and operable with Tab, Shift+Tab, Enter, Space, Escape, arrows in composite widgets. Source order is the tab order; no positive `tabIndex`.
- Focus: never remove the focus ring without a visible replacement. Dialogs trap focus and return it to the opener. After navigation or a blocking error, move focus to the page heading or the error.
- Contrast: text 4.5:1, large text and UI borders 3:1, in light and dark themes. Never encode meaning by colour alone: stream colours and status chips also carry a text label or icon, and the days-covered strip has a legend and a text alternative.
- Headings in order (one `h1` per page), landmarks (`header`, `nav`, `main`), tables with `caption` and `th scope`, images and charts with text alternatives (`alt=""` only for decoration). Respect `prefers-reduced-motion`.

## 9. Testing

Vitest + Testing Library for units and components, MSW for the API, Playwright for the single e2e pass.

- Test what the user sees and does, not component internals or state. Work with DOM nodes, not instances.
- Query priority: `getByRole` (with `name`) first, then `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, `getByAltText`, `getByTitle`, and `getByTestId` only as a last resort. If `getByRole` cannot find it, the accessibility is probably wrong: fix the component.
- Use `userEvent`, not `fireEvent`. Use `findBy*` / `waitFor` for async results; never fixed sleeps.
- Use `screen`; assert with `@testing-library/jest-dom` (`toBeVisible`, `toHaveAccessibleName`).
- Mock at the network with MSW handlers typed from the generated API types, never by mocking `fetch`, the client or hooks. Each test gets a fresh `QueryClient` with `retry: false`.
- Pure logic (reducers such as `applyEvent`, `fromCsv`, ajv resolver) gets plain unit tests; replaying a recorded event list must equal the live view.
- Tests are fast (under about 1 s each), isolated, and deterministic: no real time, network or LLM.
- Development profile: `vitest related --run <changed files>`. Before each commit: full fast suite. e2e only in the release run and the single integration pass.
- Required tests: shell routing, auth guard, refresh flow, no-comments rule, import-boundary rule.

## 10. Checklist for every frontend subagent

- [ ] Read this file, `AGENTS.md` and `../docs/contracts.md` first; change no route or payload that is not in the contract.
- [ ] Touched only the files I own; no import from another feature; shared code moved to `shared/`.
- [ ] Folder names one lower-case word; I/O functions named `from<Format>` / `to<Format>`; English only.
- [ ] No comments in code; one-line JSDoc only on exported functions and components; nothing dead or unused.
- [ ] Nesting at most 3 levels, functions about 40 lines, guard clauses, full-word names.
- [ ] `strict` clean: no `any`, no `as` to silence errors, no `!`; external data is `unknown` until validated; API types are generated.
- [ ] No default values for engineering or economic inputs; missing values rendered with `<Missing>`; numbers with `<Quantity>`; no competition-specific values outside example fixtures.
- [ ] gemini names, units and schemas used as given; sections, modules and units read from the API, not hard-coded.
- [ ] State minimal and owned once; derived values computed in render; no Effect where an event handler, `key`, or render calculation works; Rules of Hooks respected.
- [ ] Server data only through TanStack Query: key factory, `queryOptions` factory, invalidation by key prefix, promise returned from `onSuccess`.
- [ ] Loading, empty, error and permission states exist and are tested.
- [ ] Forms use the shared ajv resolver; schema is the only source of rules; unsaved-changes guard in place; no `window.confirm`.
- [ ] Accessible: labels, keyboard operation, visible focus, contrast in both themes, no meaning by colour alone.
- [ ] Tests written first for bug fixes; queries by role; MSW for the network; each test under about 1 s.
- [ ] Ran `vitest related --run` on changed files, then `npm run check` (types, lint, tests) green before reporting.
- [ ] Updated `AGENTS.md` ("Start here") and `docs/` in the same change; notes in `.tmp/build/<task>.md`; summary at most 15 lines.
