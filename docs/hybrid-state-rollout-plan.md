# Hybrid State Rollout Plan (No-Regression)

## Goal

Maintain both React Query and Zustand without changing product behavior.

## Status Snapshot (2026-02-22)

1. Phase 1 guardrails are complete.
2. Phase 2 duplication controls are complete.
3. Phase 3 is in progress:
   - EndPlan refactors are largely complete (page/model/API decomposition, no query-to-store sync).
   - Keys is now mostly query-owned for public metadata in feature flows (`useKeyMaterial`), while runtime private key stays in Zustand.
   - Auth session/profile ownership is now query-first (`useAuthUser` + auth mutations); legacy auth store orchestration has been removed.
4. Phase 4 remains manual QA verification per slice.

## Phase 1: Guardrails (safe, no behavior change)

1. Document ownership rules (`docs/state-ownership.md`).
2. Enforce `npm run state:check` to block new duplication patterns.
3. Remove dead Zustand coupling points that are no longer used for data flow.
4. Keep current API contracts and UI flows unchanged.

## Phase 2: Stop New Duplication

1. Any new server data must be added via React Query hooks.
2. Any new local-only state can use local component state first, then Zustand if shared.
3. Reject PRs that duplicate server entities in both React Query and Zustand.

## Phase 3: Domain-by-Domain Cleanups

1. Auth domain:
   - Keep current behavior.
   - Gradually move session/profile reads to React Query-only selectors/hooks.
2. EndPlan domain:
   - Keep decryption runtime state behavior.
   - Incrementally remove query-to-store synchronization.
3. Keys domain:
   - Keep private key runtime handling in client-only state.
   - Keep server key metadata in React Query.

## Phase 4: Verification Checklist per Change

Before merging each state refactor:

1. Login/logout still works.
2. Signup still generates keys and initial vault.
3. Verify email and resend flows still work.
4. Dashboard/vault/shared-vault pages still render with same behavior.
5. Unlock modal behavior remains unchanged.

## Rollback Rule

If any domain cutover alters behavior, revert only that slice and keep guardrails/docs in place.
