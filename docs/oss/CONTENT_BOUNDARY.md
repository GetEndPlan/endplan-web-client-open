# OSS content boundary

Started from private `v.1.0.1`. This tree stays current with private `main`, with the mock backend and the sanitization rules below.

**Naming:** Product name stays **EndPlan**. Do not rebrand the OSS tree to a different product name.

## Include (ship in public)

| Area | Path / notes |
| --- | --- |
| Client crypto | `src/shared/lib/crypto/`, `docs/crypto-architecture.md` |
| Shared UI / lib | `src/shared/**` |
| Features (vault, auth UI, billing UI client) | `src/features/**` — billing uses API; no payment secrets in client |
| App shell / pages | `src/app/**`, `src/pages/**` |
| EndPlan product copy | Locales / UI strings keep “EndPlan” |
| Placeholder logos | `src/assets/logos/wordmark_*.svg`, `symbol_*.svg` (geometry + EndPlan text; not the proprietary pack) |
| UI icon pack | `src/assets/iconpack/` — section and file-type icons the client imports |
| Placeholder favicon | `public/favicon.svg` |
| License / security / contributing | `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md` |
| Env contract | `.env.example`, `.env.stubs.example`, `ENV.md`, `src/vite-env.d.ts` |
| Mock backend | `stubs/` — local fake auth+API; not the private servers |
| Client contracts | `docs/contracts/` — how outsiders run without `endplan-api` |

## Exclude (never copy to public)

| Area | Notes |
| --- | --- |
| Proprietary logo packs | Original `endplan_*.svg` design files, SYS assets, EPS/PNG/SVG brand kits |
| Branded favicon packs | EndPlan PNG favicon sets under `src/assets/favicons/` |
| Local secrets | `.env`, `.env.*` (except `.env.example`) |
| Private notes | `FEATURES.md` (gitignored) |
| Sibling auth scripts | `auth:*`, `dev:all`, `../endplan-auth-server` |
| Dead server deps | `express`, `cors`, `helmet`, `express-rate-limit`, `pg` |
| Private git history | Prefer fresh public repo / curated export |
| Hardcoded product hosts | `*.endplan.com`, `sys-demo.*` as required defaults in OSS batches (footer links are env-optional) |

## Still TBD (policy)

- Public GitHub org/repo name
- Counsel-final license confirmation (intended license is GPLv3 / `GPL-3.0-or-later`)
- Trademark / fork naming policy (EndPlan name stays; forks must not imply official affiliation)
- Whether billing UI stays in later batches
- Whether API/auth repos are open-sourced later (default: no; use `stubs/` + `docs/contracts/`)
