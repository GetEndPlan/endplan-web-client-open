# React Query in EndPlan Web Client

This document describes how **TanStack React Query** is set up in the app and which features you can use as you replace direct API calls with queries and mutations. It ties each feature to concrete EndPlan use cases (vaults, sections, trusted circle, invitations, release/claims, billing, keys, auth) and how the app benefits.

---

## Current setup

- **Query client**: `src/shared/lib/query-client.ts`
  - **staleTime**: 5 minutes (default) – data is considered fresh for 5 minutes; no refetch in that window.
  - **retry**: 1 – failed requests retry once before surfacing an error.
  - **refetchOnWindowFocus**: false – no refetch when the user returns to the tab (you can enable per-query if needed).
- **API layer**: `src/shared/api/client.ts` – `api.get/post/put/patch/delete` with `ApiError`; use these inside `queryFn` / `mutationFn`.
- **Existing pattern**: `src/features/trusted-circle/api/hooks.ts` – query keys, `useQuery`, `useMutation`, and `queryClient.invalidateQueries` on success. Use this as the reference when adding hooks for other features.

---

## Features to use and how they benefit the app

### 1. **Caching and request deduplication**

**What it does**: React Query caches by **query key**. Same key = one request in flight and one cached result shared by all components.

**Use in EndPlan**:

- **Vault list**: `useVaults()` with key `['vaults']` (or `['vaults', 'owned']`). Dashboard, shared-vault list, grant-access flow, and endplan-service can all use the same hook; only the first mount triggers a request, others read from cache.
- **Vault by ID**: `useVault(vaultId)` with key `['vaults', vaultId]`. Multiple components (header, section list, share card) can use the same vault without duplicate GETs.
- **Sections for a vault**: `useVaultSections(vaultId)` with key `['vaults', vaultId, 'sections']`. Section list and section detail can share one fetch.
- **Trusted circle / invitations**: Already done in `hooks.ts` – members, memberships, sent/received invitations are cached and deduplicated.

**Benefit**: Fewer redundant calls, faster navigation when data is still fresh, less load on the API. Especially helpful when the same vault or section is shown in several places.

---

### 2. **Stale-while-revalidate and `staleTime`**

**What it does**: After `staleTime`, data is “stale” but still shown. A refetch can happen in the background (e.g. on mount or refocus); UI stays responsive.

**Use in EndPlan**:

- **Default 5 min**: Good for vault list, section list, trusted circle – no refetch on every tab switch.
- **Shorter for “live” data**: e.g. `usePendingClaims()` or `usePendingReleaseInvitations()` with `staleTime: 0` or 30s so the dashboard and edit-endplan pages see updates soon after a claim or release.
- **Longer for stable data**: e.g. billing products with `staleTime: 1000 * 60 * 15` (15 min) so pricing doesn’t refetch often.

**Benefit**: Users see cached data immediately; fresh data is loaded in the background when appropriate. Balances freshness with performance and API usage.

---

### 3. **Loading and error state**

**What it does**: `useQuery` exposes `isLoading`, `isFetching`, `isError`, `error`, `refetch`. No manual `useState` for loading/error.

**Use in EndPlan**:

- **Vault/section pages**: Use `isLoading` for initial skeleton, `isError` + `error` to show “Failed to load vault” and retry.
- **Checksum / 409**: If the API returns 409 `checksum_mismatch`, you can detect `error?.data?.code === 'checksum_mismatch'` and show a specific “Data integrity check failed” message.
- **Keys, billing, profile**: Same pattern – one hook, consistent loading and error handling across the app.

**Benefit**: Consistent UX (spinners, error messages, retry) and less boilerplate than manual fetch + setState.

---

### 4. **Mutations and cache invalidation**

**What it does**: `useMutation` runs a side effect (create/update/delete). In `onSuccess` you call `queryClient.invalidateQueries({ queryKey })` so related queries refetch and the UI stays in sync.

**Use in EndPlan**:

- **Vault create/update/delete**: After success, invalidate `['vaults']` (and optionally `['vaults', vaultId]` on update). Vault list and vault detail update everywhere.
- **Section create/update/delete**: Invalidate `['vaults', vaultId, 'sections']` and, for section detail, `['vaults', vaultId, 'sections', sectionId]`. Section list and open section refetch.
- **Trusted circle**: Already implemented – invite/remove/update member and accept/decline/cancel invitation invalidate the right keys so members and invitations lists stay correct.
- **Release / claim**: After `claimAccess` or release, invalidate `['pending-claims']` and any vault/section lists that might change (e.g. shared vaults).
- **Billing**: After checkout or cancel, invalidate subscription/portal queries so billing UI reflects new state.
- **Profile / liveness**: After PATCH profile or liveness, invalidate `['user', 'profile']` or `['user', 'liveness']` so settings screens show new data.

**Benefit**: One place (mutation `onSuccess`) defines “what to refresh”; all components using those queries get updated data without manual refetch calls or store updates.

---

### 5. **Query keys as a single source of truth**

**What it does**: Define key factories (e.g. `vaultKeys.all`, `vaultKeys.byId(id)`, `vaultKeys.sections(vaultId)`) and use them in both `useQuery` and `invalidateQueries`. Changing the key shape happens in one place.

**Use in EndPlan**:

- **Vaults**: e.g. `vaultKeys = { all: ['vaults'], byId: (id) => ['vaults', id], sections: (vaultId) => ['vaults', vaultId, 'sections'], sectionById: (vaultId, sectionId) => ['vaults', vaultId, 'sections', sectionId] }`.
- **Billing**: e.g. `billingKeys.products()`, `billingKeys.subscription()`.
- **Keys**: e.g. `keysKeys.mine()`, `keysKeys.public(userId)`.
- **User**: e.g. `userKeys.profile()`, `userKeys.liveness()`.

**Benefit**: Safe invalidation (e.g. invalidate all vault-related with `queryKey: vaultKeys.all` or only one vault’s sections with `vaultKeys.sections(vaultId)`). Matches the pattern you already use in trusted-circle.

---

### 6. **Conditional fetching with `enabled`**

**What it does**: `useQuery` accepts `enabled: boolean`. When `enabled` is false, the query does not run.

**Use in EndPlan**:

- **Vault/section detail**: `useVault(vaultId)` with `enabled: !!vaultId` so you don’t request when navigating or before ID is available.
- **Invitation by token**: Already used in `useInvitationByToken(token)` with `enabled: !!token`.
- **Keys**: Fetch user keys only when the user is authenticated and keys are needed; use `enabled: isAuthenticated && keysRequired`.
- **Billing**: Fetch subscription only when on billing/settings or when showing upgrade prompts; use `enabled: showBilling`.

**Benefit**: No unnecessary or invalid requests (e.g. GET `/vaults/undefined`), and you can gate expensive or sensitive calls behind feature flags or route.

---

### 7. **Retries and `retry`**

**What it does**: Failed queries can retry (your global default is `retry: 1`). You can set `retry: false` for non-idempotent or “not found” cases.

**Use in EndPlan**:

- **Invitation by token**: Already `retry: false` – wrong or expired token should not retry.
- **401/403**: You can use `retry: (failureCount, error) => !error?.isUnauthorized && !error?.isForbidden` (or similar) so auth errors don’t retry.
- **Vault/section GET**: Default single retry is fine for transient network errors.

**Benefit**: Better resilience to flaky networks without retrying when it’s pointless (auth, bad token, 404).

---

### 8. **Optimistic updates (optional)**

**What it does**: Update the cache immediately in `onMutate`, then roll back in `onError` if the mutation fails. UI feels instant.

**Use in EndPlan**:

- **Section reorder**: Optimistically reorder sections in the cache; on failure, invalidate and refetch.
- **Toggle section visibility or display order**: Same idea – optimistic cache update, rollback on error.
- **Trusted circle**: Optimistically remove a member from the list; on failure, invalidate members.

**Benefit**: Smoother UX for frequent, low-risk actions. Use sparingly; prefer invalidation for critical or complex data (e.g. encrypted vault payload).

---

### 9. **`select` for derived data**

**What it does**: `select` in `useQuery` transforms the API response. Only when the selected slice changes does the component re-render; other changes in the response are ignored.

**Use in EndPlan**:

- **Trusted circle**: Already used – `select: (data) => data.members` so the component depends only on `members`, not the full wrapper.
- **Vault list**: `select: (data) => data.vaults` for list responses.
- **Pending claims**: Already `select: (data) => data?.claims ?? []` so the component gets a stable array.

**Benefit**: Fewer re-renders and clearer “what this screen needs” from the API response.

---

### 10. **Prefetching**

**What it does**: `queryClient.prefetchQuery({ queryKey, queryFn })` loads data before the user navigates, so the next page opens with data already in cache.

**Use in EndPlan**:

- **Vault list on dashboard**: Prefetch vaults when the user lands on the app so the vault list is ready when they open “My Vaults”.
- **Section list**: On vault list, prefetch sections for the first vault or for the last-opened vault so the section page loads instantly.
- **Invitation accept flow**: Prefetch membership list or vault list after accept so the next screen is fast.

**Benefit**: Faster perceived navigation and less waiting on critical paths (vault → sections → section detail).

---

## Suggested rollout

1. **Define query key factories** for vaults, sections, billing, keys, user (profile/liveness), and keep trusted-circle keys as-is.
2. **Add `useQuery` hooks** for every GET you currently do in stores or components (vault list, vault by ID, sections, section by ID, billing products/subscription, keys, profile, pending claims, etc.). Use your existing `api` in `queryFn` and set `enabled` where needed.
3. **Add `useMutation` hooks** for every POST/PUT/PATCH/DELETE. In `onSuccess`, invalidate the relevant query keys so lists and details stay in sync.
4. **Replace direct `vaultApi` / `endplan-service` / store calls** in components with these hooks so loading/error and cache updates are consistent.
5. **Optionally** add prefetching on key routes and optimistic updates only where they clearly improve UX and are safe to roll back.

---

## Summary table

| Feature              | Use in EndPlan                                      | Benefit                                      |
|----------------------|------------------------------------------------------|----------------------------------------------|
| Caching / deduplication | Vaults, sections, trusted circle, invitations       | Fewer requests, shared data across components |
| staleTime            | 5 min default; 0–30s for pending claims/release      | Balance freshness vs performance             |
| Loading/error        | All screens that fetch data                          | Consistent UX, less boilerplate              |
| Mutations + invalidation | Create/update/delete vault, section, member, etc. | UI stays in sync after changes               |
| Query key factory    | vaultKeys, billingKeys, keysKeys, userKeys           | Safe, predictable invalidation               |
| enabled              | Vault/section by ID, invitation by token, keys       | No invalid or unnecessary requests           |
| retry                | Default 1; false for token/404; skip for 401/403      | Resilience without useless retries           |
| select               | List responses (e.g. `.vaults`, `.members`)          | Fewer re-renders, clear data shape           |
| Prefetch             | Vault list, sections, post-invitation-accept         | Faster navigation                            |
| Optimistic updates   | Reorder, toggles; avoid for encrypted payload        | Instant feedback where safe                  |

Using these features as you replace API calls will give the app a single, consistent data layer: cached, deduplicated, with clear loading/error and invalidation rules, while keeping your existing `query-client` defaults and the trusted-circle hooks as the reference pattern.
