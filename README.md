# EndPlan Web Client (open source)

Sanitized open-source export of the EndPlan web client: React 19 + TypeScript + Vite,
client-side crypto, vault UI shell, and auth/API clients.

**Baseline:** curated from private `endplan-web-client` branch `v.1.0.1` (batched publish — not a live mirror).

## What this repo is

- A runnable EndPlan SPA you can point at your own auth + API via `VITE_AUTH_URL` / `VITE_API_URL`
- Client crypto suitable for audit (`src/shared/lib/crypto/`)
- Placeholder logos (proprietary brand packs excluded); product name remains **EndPlan**

## What this repo is not

- Not the private EndPlan production monorepo
- Not a continuous sync of every private commit
- Auth server and Go API stay private — use `npm run stubs` or your own backends

See `docs/oss/CONTENT_BOUNDARY.md` and `docs/oss/PUBLISH.md`.

## Requirements

- Node.js **≥ 22.12** (see `.nvmrc`)

## Quickstart

```bash
npm install
cp .env.stubs.example .env
npm run stubs    # terminal 1 — mock auth+API (not the private servers)
npm run dev      # terminal 2
```

Demo login: `demo@example.com` / `Demo1234!`

Both `VITE_AUTH_URL` and `VITE_API_URL` must be the **same origin** (`http://localhost:8080`) so the session cookie is sent with API calls. Details: `stubs/README.md`.

To use your own backends instead, copy `.env.example` and set the URLs yourself.

Optional checks:

```bash
npm run lint
npm test
npm run build
npm run oss:sanity
```

## Environment

| Variable | Required? | Purpose |
| --- | --- | --- |
| `VITE_AUTH_URL` | Dev: yes (or same-origin) | Better Auth base |
| `VITE_API_URL` | Dev: yes (or same-origin) | Go API base |
| `VITE_SUPPORT_URL` | Optional | Footer support link |
| `VITE_TERMS_URL` | Optional | Footer terms link |
| `VITE_PRIVACY_URL` | Optional | Footer privacy link |
| `VITE_PLAUSIBLE_DOMAIN` | Optional | Analytics off if unset |
| `VITE_PLAUSIBLE_ENABLE_IN_DEV` | Optional | Local Plausible |

Details: `ENV.md`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint + architecture/state/typography checks
- `npm test` — unit tests
- `npm run oss:sanity` — fail on proprietary brand paths / forbidden host strings
- `npm run oss:prepare-export` — copy sanitized tree to `../endplan-web-client-public` for first public push
- `npm run stubs` — local mock auth+API for OSS contributors

## Architecture

Feature-sliced layout under `src/` (`app`, `pages`, `features`, `shared`). See `docs/web-client-architecture.md`.

## License & security

This project is licensed under the **GNU General Public License v3.0 or later**
(SPDX: `GPL-3.0-or-later`). The full terms are in [`LICENSE`](LICENSE).

Copyright (C) 2026 EndPlan contributors

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but **without
any warranty**; without even the implied warranty of merchantability or fitness
for a particular purpose. See the GNU General Public License for more details.

If you distribute this software or a modified version, you must also provide
the corresponding source under the same GPLv3 terms. Contributions are accepted
under the same license (see `CONTRIBUTING.md`).

- Coordinated disclosure: `SECURITY.md`
- Contributing: `CONTRIBUTING.md`

Public marketing claims still follow `docs/oss/PUBLISH.md`.

## Trademark

“EndPlan” and related marks remain proprietary. Forks must not imply official EndPlan affiliation
without permission. Proprietary logo/icon packs are excluded from this export; placeholder marks are
generic geometry with the EndPlan product name.
