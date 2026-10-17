# EndPlan Web Client

[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Node.js ≥ 22.12](https://img.shields.io/badge/node-%E2%89%A522.12-brightgreen.svg)](.nvmrc)

Open-source **EndPlan** single-page app: an end-of-life vault you unlock in the browser.

React 19 · TypeScript · Vite. Vault content is encrypted **on the client** before it is sent to an API. This repository is a sanitized public export of that client (crypto, vault UI, auth/API clients). The production auth server and Go API stay private.

```
Password ──Argon2id──► KEK (never stored)
                         │
                         ├── AES-256-GCM ──► user private keys
                         │
                         DEK (random 32 bytes)
                         │
                         ├── wrapped per recipient (X25519; optional ML-KEM-768 hybrid)
                         └── HKDF-SHA256 ──► purpose keys ──► AES-256-GCM (+ AAD)
                                            vault / sections / documents
```

## Features

- [x] Zero-knowledge vault UI (assets, policies, documents, instructions, contacts)
- [x] Client-side cryptography suitable for audit (`src/shared/lib/crypto/`)
- [x] Better Auth session client + Go API client contracts
- [x] Local mock auth + API so you can run without private backends (`npm run stubs`)
- [x] Export flow (CSV / documents / overview PDF)
- [x] i18n (English / French) and dark mode

## Status

This is a **batched** publish from the private EndPlan web client — not a live mirror of every private commit. Prefer the latest public tag when reporting issues.

| In this repo | Not in this repo |
| --- | --- |
| SPA + client crypto | Production auth server |
| Mock backend (`stubs/`) | Production Go API |
| Placeholder EndPlan marks | Proprietary logo / favicon packs |

## Requirements

- **Node.js ≥ 22.12** (see [`.nvmrc`](.nvmrc))

## Getting started

Run the app against the in-repo mock (two terminals):

```bash
npm install
cp .env.stubs.example .env

npm run stubs   # terminal 1 — mock auth + API on http://localhost:8080
npm run dev     # terminal 2 — Vite on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173).

| | |
| --- | --- |
| **Email** | `demo@example.com` |
| **Password** | `Demo1234!` |

`VITE_AUTH_URL` and `VITE_API_URL` must share the **same origin** so the session cookie is sent with API calls. Details: [`stubs/README.md`](stubs/README.md).

To point at your own backends instead:

```bash
cp .env.example .env
# edit VITE_AUTH_URL / VITE_API_URL
npm run dev
```

Environment reference: [`ENV.md`](ENV.md). For local backends without production auth/API, use [`stubs/README.md`](stubs/README.md).

## Development

```bash
npm run lint
npm test
npm run build
npm run oss:sanity   # fails on proprietary brand paths / forbidden host strings
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run stubs` | Local mock auth + API |
| `npm run build` | Production build |
| `npm run lint` | ESLint + architecture / state / typography checks |
| `npm test` | Unit tests |
| `npm run preview` | Preview the production build |

Feature-sliced layout under `src/` (`app`, `pages`, `features`, `shared`).

## Security

Please **do not** open public issues for vulnerabilities. See [`SECURITY.md`](SECURITY.md) for coordinated disclosure.

In scope for this repository: client crypto, XSS, SPA session handling, and secret leakage via the frontend bundle. Production infrastructure and private backends are out of scope unless you are authorized to test them.

## Contributing

Contributions are welcome under the same **GPL-3.0-or-later** terms. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## License

This project is licensed under the **GNU General Public License v3.0 or later**
(SPDX: `GPL-3.0-or-later`). See [`LICENSE`](LICENSE).

Copyright (C) 2026 EndPlan contributors

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but **without
any warranty**; without even the implied warranty of merchantability or fitness
for a particular purpose. See the GNU General Public License for more details.

## Trademark

“EndPlan” and related marks remain proprietary. Forks must not imply official
EndPlan affiliation without permission. Proprietary logo and favicon packs are
excluded from this export; placeholders are generic geometry with the EndPlan
product name.
