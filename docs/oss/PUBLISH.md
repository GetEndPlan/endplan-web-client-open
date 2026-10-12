# Batched publish checklist

Private → public is **one-way and intentional**. Do not auto-mirror every private commit.

## When to publish

Owner closes a “series” (crypto fix series, release milestone, or chosen cadence), then runs this checklist once.

## Checklist

1. **Pin source** — record private branch/tag/SHA (first batch: `v.1.0.1`).
2. **Exclude** — confirm `docs/oss/CONTENT_BOUNDARY.md` exclude list; no logos/SYS/iconpack/`.env`.
3. **Sanitize delta** — strip sibling auth scripts, dead server deps, product host hardcodes.
4. **Secret scan** — no tokens, keys, decrypted payloads; `.env` not staged.
5. **Verify** — in the export tree:
   ```bash
   npm ci
   npm run lint
   npm test
   npm run build
   npm run oss:sanity
   ```
6. **Docs** — README/CONTRIBUTING/SECURITY still accurate; marketing claims match the public surface.
7. **Push** — one curated commit (or few) to the **public** repo with **fresh history** for the first push; later batches are discrete updates. Helper: `npm run oss:prepare-export` (writes `../endplan-web-client-public` by default).
8. **Tag** — `v0.x.y` + release notes of what changed vs prior public tag.
9. **Lag** — public may trail private; that is intentional.
10. **Naming** — keep product name **EndPlan**; do not rebrand the public tree.

## First public push (DoR)

From the Confluence plan — do **not** push publicly until:

- [ ] Counsel-approved LICENSE (intended license is GPLv3 / `GPL-3.0-or-later`)
- [ ] Trademark / brand rights cleared or assets excluded (assets excluded here)
- [ ] Public repo name + org decided
- [ ] Empty public repo created; this sanitized tree is the first commit
- [ ] Public CI green without secrets
