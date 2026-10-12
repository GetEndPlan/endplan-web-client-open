# Security Policy

## Supported versions

Security fixes are published on a **batched** cadence with the open-source EndPlan web client
releases tagged in this repository. Prefer the latest public tag when reporting issues.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email coordinated disclosure to: **security@endplan.com**

Include:

- Affected public tag / commit SHA if known
- Description and impact
- Reproduction steps or proof-of-concept (private)
- Whether you plan to disclose publicly and on what timeline

We aim to acknowledge reports within **5 business days** and will coordinate a fix
and disclosure timeline with you.

## Scope

In scope for this client repository:

- Client-side cryptography and key handling in `src/shared/lib/crypto/`
- XSS, auth session handling in the SPA, and secret leakage via the frontend bundle

Out of scope unless separately published:

- Private EndPlan production infrastructure
- Auth server and Go API (report only if you are authorized to test those systems)
