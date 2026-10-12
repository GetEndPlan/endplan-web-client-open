# State Ownership (React Query + Zustand)

This project intentionally keeps both `@tanstack/react-query` and `zustand`.
To avoid data drift and regression risk, each state domain must have one owner.

## Ownership Rules

1. React Query owns all server state.
2. Zustand owns only client/runtime state.
3. Do not mirror the same entity in both layers.
4. Components should read from the owning layer directly.
5. Mutations for server data go through React Query hooks.

## Server State (React Query)

- Session/profile/liveness API responses.
- Billing products/subscription/portal data.
- Trusted circle members/invitations/memberships.
- Vaults/shared vaults/sections and related API payloads.
- Keys metadata from API (`useKeys`), including public key material.

## Client Runtime State (Zustand or local state)

- Auth actions/mutation orchestration only (login/signup/logout side-effects), not session/profile entity ownership.
- Unlocked private key material and lock/unlock runtime flags.
- Theme preference and toast UI state.
- Local form state, modal state, draft edits.

## Anti-Patterns (Not Allowed)

- Query-to-store mirroring for the same domain.
- Calling API clients directly from zustand stores for server entities.
- Using store state as "cache" for API query results.
- Feature code reading server-owned key metadata directly from store instead of `useKeyMaterial` / query hooks.

## Automated Guardrail

Run `npm run state:check` to detect:

1. New `*FromQuery` synchronization symbols outside approved legacy files.
2. Any usage of removed legacy symbols (`useTrustedCircleStore`, `useBillingStore`).

## Logout/Cleanup Contract

On logout or forced post-reset cleanup:

1. Clear React Query cache.
2. Clear runtime key state.
3. Clear EndPlan runtime decrypted state.

This preserves existing behavior while keeping server state ownership in React Query.
