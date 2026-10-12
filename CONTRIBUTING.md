# Contributing

Thanks for contributing to the open-source EndPlan web client.

By contributing, you agree that your contributions are licensed under the
**GNU General Public License v3.0 or later** (`LICENSE`). Do not submit code
you cannot license under GPLv3.

## Prerequisites

- Node.js ≥ 22.12 (`nvm use` if you use nvm; see `.nvmrc`)
- Either the local mock (`npm run stubs`) or your own auth/API URLs

## Setup

```bash
npm install
cp .env.stubs.example .env
npm run stubs    # terminal 1
npm run dev      # terminal 2
```

Demo login: `demo@example.com` / `Demo1234!`. See `stubs/README.md`.

Before opening a PR:

```bash
npm run lint
npm test
npm run build
npm run oss:sanity
```

## Pull requests

- Do **not** add proprietary EndPlan/SYS logos, icon packs, or product host maps
- Do **not** commit `.env`, secrets, tokens, or decrypted vault material
- Prefer small, focused changes with clear intent
- Keep pages thin; put business logic in `src/features/*`
- Follow existing React Query / Zustand boundaries
- Keep the product name **EndPlan** (do not rebrand the OSS tree)

## Importing changes into the private product

This public repo is **not** continuously mirrored into the private EndPlan client.
Maintainers may selectively import community changes after review. There is no
guarantee that a public PR will land in the private product tree.

## Code of conduct

Be respectful. Harassment and bad-faith security disclosure are not tolerated.
