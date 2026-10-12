# Web client memory and performance profiling

Use this checklist when investigating heap growth, tab sluggishness, or mobile Safari kills.

## 1. Chrome DevTools (desktop)

1. Open the app, reproduce the flow (e.g. open **Assets**, **Documents**, download a large file, grant access).
2. **Performance** → record 10–20s while interacting; look for long tasks, layout thrash, and GC right after spikes.
3. **Memory** → take a **heap snapshot** before and after the flow:
   - Sort by **Retained size**; look for large `ArrayBuffer`, `string`, `Object`, and detached DOM.
   - Search for `Query`, `FiberNode`, and your feature names to see what retains graphs.
4. **Memory** → enable **Allocation instrumentation on timeline** for a short session to catch short-lived spikes (uploads, decrypt, base64).

## 2. Safari Web Inspector (iOS / WebKit)

1. Connect device → **Develop** → **[device]** → **[page]**.
2. **Timelines** → **Memory** while repeating the same flows (WebKit is stricter on memory).
3. Watch for jetsam after large downloads or heavy **Assets** grids.

## 3. Application-specific hotspots (codebase)

| Area | What to watch |
|------|----------------|
| **Vault section blobs** | `fetchBlobAsBase64` uses `uint8ArrayToBase64` (direct bytes → base64, no full-size intermediate binary string). Peak is still `ArrayBuffer` + result string while encoding. |
| **React Query** | Cached `documents` tree, `assets` schema, attachments; count of active `queryKey`s after navigation. |
| **Assets autosave** | Pending snapshot size; IndexedDB vs legacy localStorage (see `assets-autosave-queue.ts`). |
| **Documents decrypt** | Full-tree name decrypt in memory until replaced on refetch. |
| **Downloads** | Full-file `arrayBuffer` + decrypt + `Blob` until download starts and GC runs. |

## 4. Quick regression checks

- Navigate **Dashboard → Vault → Documents → Assets → away**; take a second heap snapshot and confirm large detached graphs dropped (modulo Query `gcTime`).
- After **logout**, confirm keys cleared (`keys-store`) and no long-lived crypto buffers in snapshots.

## 5. Optional tooling

- **React DevTools Profiler** + **“Record why each component rendered”** for unnecessary list re-renders.
- **`performance.memory`** (Chrome only): log `usedJSHeapSize` at milestones in dev builds if you add temporary instrumentation.
