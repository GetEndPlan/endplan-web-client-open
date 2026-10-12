# Client contracts (without open-sourcing backends)

`endplan-api` and `endplan-auth-server` stay **private**.

Outsiders should use:

1. **This client’s TypeScript API modules** as the live contract (`src/features/*/api`, `src/shared/api`).
2. The **mock server** in `stubs/` for a runnable stand-in (`npm run stubs`).

The mock implements the HTTP paths the SPA already calls. It is intentionally incomplete: missing routes return `501` `{ code: "not_implemented" }`.

Do not copy private server source into this repository.
