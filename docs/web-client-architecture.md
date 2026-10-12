# EndPlan web client — architecture and conventions

This document describes how the **endplan-web-client** app is structured, how state and UI interact, and how we keep quality consistent over time.

## Principles

- **Feature-sliced design**: Business capabilities live under `src/features/<feature>/` with clear internal layers (`api`, `hooks`, `model`, `ui`). The app shell (`src/app`) and route entry points (`src/pages`) stay thin.
- **Layer boundaries**: `pages` composes features; features do not import from `pages`. Shared code in `src/shared` stays generic (no feature rules). See `.cursor/rules/architecture.mdc` for the full layering contract.
- **Single source of truth for cross-layer contracts**: When a React page and its data hook must agree on props or view-model shapes (for example vault instructions), shared types and pure helpers belong in `features/<feature>/model/` rather than duplicated at the top of UI and hook files.
- **Preserve behavior first**: Refactors extract types and pure functions; they do not change product behavior without an explicit requirement.

## Folder structure (high level)

| Area | Role |
|------|------|
| `src/app` | Providers, routing shell, global layout |
| `src/pages` | Route-level composition; minimal logic |
| `src/features/<feature>/api` | HTTP/query/mutation hooks keyed to backend |
| `src/features/<feature>/hooks` | Feature orchestration, derived state, wiring UI to api/model |
| `src/features/<feature>/model` | Types, payloads, pure transforms, shared view-model types |
| `src/features/<feature>/ui` | Feature components; may import hooks only when appropriate for colocated containers |
| `src/shared` | Design-system-style UI, `cn`, sanitization, generic utilities |
| `src/entities` | Small cross-feature domain pieces where justified |

Public entry points for a feature often use `index.ts` barrels; prefer `@/` path aliases for imports from outside the feature when the project is configured for them.

## State management

- **Server state**: TanStack Query in `features/*/api` — queries, mutations, cache keys.
- **Client / URL-driven flows**: Route params and local `useState` / `useMemo` inside feature hooks (for example `useVaultInstructionsPage`) that combine query results with navigation.
- **Global stores**: Zustand (and related patterns) live behind explicit boundaries; automated checks in `scripts/check-state-ownership.mjs` help prevent accidental coupling.

Feature hooks are the right place to coordinate loading, mutations, and option lists that feed presentational UI.

## Component patterns

- **Presentational vs orchestration**: Large screens (for example vault instructions) receive data and callbacks via props; the hook owns I/O and side effects. That keeps components testable and avoids burying network logic in JSX.
- **Type extraction for large UIs**: Very large tables or pages may split **types** (`*.types.ts`), **pure helpers** (`*-helpers.ts`), and **main component** (`*.tsx`) to reduce noise and merge conflicts, without changing the public component API.
- **Shared props between hook and UI**: Define once in `model/` (for example `instructions-page.types.ts`, `instructions-form-state.ts`) so TypeScript enforces parity between `useVaultInstructionsPage` and `VaultInstructionsPage`.

## Testing strategy

- **Unit tests** use Node’s built-in `node:test` runner via `tsx` (`npm run test` / `test:unit`).
- **Model and pure functions** are preferred test targets: deterministic, fast, no DOM.
- **API key factories and security helpers** have targeted tests under `__tests__/` next to the code they protect.
- UI-heavy flows rely on type-checking, lint, architecture scripts, and manual QA when behavior is visual.

## Validation scripts (CI-friendly)

Run as part of `npm run lint` unless noted:

| Script | Purpose |
|--------|---------|
| `scripts/check-state-ownership.mjs` | `npm run state:check` — restricted global store usage |
| `scripts/check-typography-usage.mjs` | `npm run typography:check` — typography consistency |
| `scripts/validate-web-client-architecture.mjs` | `npm run architecture:validate` — structural rules for shared instruction types and split assets table modules |

To run architecture checks alone:

```bash
npm run architecture:validate
```

When adding new cross-hook/UI contracts, extend `validate-web-client-architecture.mjs` with a small, explicit rule rather than ad-hoc review-only knowledge.
