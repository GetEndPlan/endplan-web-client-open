# OSS exclude list (export filter)

Paths and patterns that must not appear in a public batch. Enforced by `npm run oss:sanity`
and by review of `docs/oss/CONTENT_BOUNDARY.md`.

## Forbidden path prefixes / names

- `src/assets/logos/endplan_`
- `src/assets/logos/brand/`, `src/assets/logos/EPS/`, `src/assets/logos/PNG/`, `src/assets/logos/SVG/`
- `src/assets/Logo SYS/`
- `src/assets/favicons/` (branded PNG packs; unused — remove if reintroduced)
- `public/favicon.png` (branded)
- `public/favicon-sys`
- `.env` (except `.env.example`)
- `FEATURES.md`

## Forbidden package.json scripts

- `auth:server`, `auth:migrate`, `auth:add-columns`, `dev:all`
- Any script referencing `../endplan-auth-server`

## Forbidden dependency names (SPA export)

- `express`, `cors`, `helmet`, `express-rate-limit`, `pg`
- Related `@types/express`, `@types/cors`, `@types/pg`
- `concurrently` (only used for private `dev:all`)

## Forbidden content patterns (source/docs in export)

- `sys-demo.endplan.com`
- `demo.endplan.com` (prefer generic examples)
- `../endplan-auth-server` as a required path for `npm run dev`
