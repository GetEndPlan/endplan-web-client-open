# Mock auth + API (for OSS contributors)

This folder is a **local fake backend**. It is **not** `endplan-api` or `endplan-auth-server`, and it is not a substitute for production.

It exists so you can run the EndPlan web client without access to private servers.

## Run

Terminal 1:

```bash
npm run stubs
```

Terminal 2 — point **both** URLs at the mock origin (same host:port so the session cookie is sent to API routes):

```bash
cp .env.stubs.example .env
npm run dev
```

Open http://localhost:5173

Demo account:

- Email: `demo@example.com`
- Password: `Demo1234!`

Sign-up also works; data is **in memory** and resets when you stop the mock.

## What it covers

Client routes used by this SPA (see `src/features/*/api`):

- Better Auth-shaped session: sign-up, sign-in, get-session, sign-out, password reset
- Profile, onboarding, liveness, erasure, verification, prompt-states
- Encryption key create/get/rotate/public bundles
- After key setup, automatically creates a decryptable empty EndPlan (vault + assets/documents/instructions sections)
- Documents tree/folders/files (init-upload, complete, download-url)
- Assets schema/categories/custom fields/attachments
- Vault access grant/rotate/rewrap-self and section access lists
- Billing: always an active mock Pro subscription (no Polar, no payments)
- Trusted circle members, invitations (create/sent/received/accept/decline/release)
- Release public-key, claim, recovery decision, pending-claims
- Activity list (empty)

Unknown authenticated `/api/v1` routes return `501` with `code: "not_implemented"`.

## What it does not do

- Send email, process payments, or talk to S3/RDS
- Replicate release-service / trusted-circle production behavior
- Persist data
- Provide production security
