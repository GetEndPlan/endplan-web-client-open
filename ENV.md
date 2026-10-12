# Environment Variables

Create a `.env` file in this directory for the Vite frontend (copy from `.env.example`).

This open-source **EndPlan** client talks to **external** auth and API services. The private
auth server and Go API are **not** in this repo.

For local UI work without those servers, run `npm run stubs` and use `.env.stubs.example`
(both `VITE_AUTH_URL` and `VITE_API_URL` must be `http://localhost:8080`).

## Frontend Configuration (Vite)

```bash
# Auth server URL (Better Auth). Empty = same origin (reverse-proxy `/api/auth/*`).
VITE_AUTH_URL=http://localhost:3001

# Go API URL. Empty = same origin (reverse-proxy `/api/v1/*`).
VITE_API_URL=http://localhost:8080

# Optional hostname that selects the sys skin. Unset keeps the default skin.
# VITE_SYS_DEMO_HOST=partner.example

# Optional footer links — when unset, those footer items are hidden
# VITE_SUPPORT_URL=https://example.com/help
# VITE_TERMS_URL=https://example.com/terms
# VITE_PRIVACY_URL=https://example.com/privacy

# Plausible Analytics — if unset or empty, analytics stays off
# VITE_PLAUSIBLE_DOMAIN=your-plausible-domain.com

# When "true", initialize Plausible during `npm run dev`. Omit in production builds.
# VITE_PLAUSIBLE_ENABLE_IN_DEV=true
```

## Auth / API backends

Run your own Better Auth–compatible auth service and Go API (or mocks) that implement the
client’s expected routes. See `docs/oss/CONTENT_BOUNDARY.md` and the README for what is
in-repo vs out of scope.

Typical local ports used in development:

| Service | Port | Env |
| --- | --- | --- |
| Auth | 3001 | `VITE_AUTH_URL` |
| API | 8080 | `VITE_API_URL` |
| Vite client | Vite default | `npm run dev` |

## Nginx / Docker notes

Optional compose and nginx templates in this repo may still reference demo hostnames for
operators who self-host. Prefer your own `SERVER_NAMES` and never ship real secrets in git.
