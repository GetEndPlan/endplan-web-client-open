# EndPlan Web Client — Folder Structure & Architecture

Generated from the current codebase. Excludes `node_modules`, `.git`, `.npm-cache`, `dist`, and build artifacts.

---

## Architecture & design

### High-level architecture

The app uses a **feature-sliced** layout inspired by [Feature-Sliced Design (FSD)](https://feature-sliced.design/):

| Layer | Role |
|-------|------|
| **app** | App shell: routing, layout, providers, route guards. No business logic. |
| **pages** | Route-level entry points. Compose features and shared UI; stay thin. |
| **features** | Vertical slices (auth, billing, endplan, keys, trusted-circle). Each has `api/`, `hooks/`, `model/`, `ui/`. |
| **entities** | Domain entities (e.g. user). Lightweight; used across features. |
| **shared** | Cross-cutting: API client, lib (crypto, i18n), and the shared UI design system. |

Features expose a **public API** via `index.ts` (barrel exports). Other layers import from `@/features/<name>` (or relative paths), not from deep paths inside a feature.

### Tech stack

| Concern | Choice |
|---------|--------|
| **Runtime** | React 19, TypeScript, Vite |
| **Routing** | React Router v7 |
| **Server state** | TanStack React Query (queries + mutations) |
| **Client state** | Zustand (keys store, toast store, theme store); persist middleware where needed |
| **Forms** | React Hook Form + Zod |
| **i18n** | i18next + react-i18next |
| **Styling** | Tailwind CSS; semantic typography in `src/styles` |
| **Auth** | Custom auth flow + `AuthProvider`; session and user via React Query + context |

### Design patterns

1. **Feature slices**  
   Each feature is self-contained: **api/** (HTTP + React Query hooks), **hooks/** (page/flow logic), **model/** (types, validation, stores), **ui/** (components). Tests live in **`__tests__`** next to the code.

2. **Server vs client state**  
   - **Server state**: React Query (`useQuery`, `useMutation`). Cache, refetch, and loading/error live in the API layer.  
   - **Client state**: Zustand for UI/session-sensitive state (e.g. keys store with persist, toast, theme). No Redux.

3. **Atomic design (shared UI)**  
   `shared/ui` is structured as **atoms → molecules → organisms → templates**:  
   - **Atoms**: Button, Input, Checkbox, Spinner  
   - **Molecules**: PasswordInput, Toast, ModalOverlay  
   - **Organisms**: Card, Sidebar, Topbar, BottomBar, CookieConsentBanner  
   - **Templates**: AuthLayout  

   Shared UI is presentational; features pass behavior via props and hooks.

4. **Route protection**  
   `ProtectedRoute` wraps all authenticated routes. It checks auth and email verification and redirects to login/verify-email or billing when needed. A single `MainLayout` wraps the protected subtree (sidebar + topbar + outlet).

5. **Providers**  
   Root composition in `app/providers`: `QueryClientProvider` → `BrowserRouter` → `AuthProvider` → children. Global UI (e.g. `ToastContainer`, `CookieConsentBanner`) is rendered in `App` next to `AppRoutes`.

6. **Barrel exports**  
   Features and `shared/ui` expose a single public surface (e.g. `@/features/auth`, `@/shared/ui`). Internal structure (e.g. `api/hooks/`) is an implementation detail.

---

```
endplan-web-client/
├── .github/                    # CI/CD workflows
├── docs/                       # Project documentation
├── public/                     # Static assets served as-is
├── scripts/                    # Build, check, and utility scripts
├── src/
│   ├── app/                    # App shell, routing, layout
│   │   ├── constants/          # Route constants, config
│   │   ├── layouts/            # Main layout, sidebar, topbar
│   │   │   └── hooks/
│   │   ├── providers/          # React context providers
│   │   │   └── hooks/
│   │   └── routes/             # Route definitions, protected route
│   ├── assets/                 # Generic images / logos (no proprietary brand packs)
│   │   └── logos/              # Placeholder wordmark + symbol SVGs
│   ├── components/             # (Legacy/global components)
│   ├── entities/               # Domain entities
│   │   └── user/
│   ├── features/               # Feature-based modules (FSD-style)
│   │   ├── auth/               # Authentication (login, signup, session)
│   │   │   ├── api/            # Auth API, hooks
│   │   │   │   ├── __tests__/
│   │   │   │   └── hooks/
│   │   │   ├── hooks/
│   │   │   ├── model/          # Auth types, validation
│   │   │   │   └── __tests__/
│   │   │   └── ui/             # Login form, invite landing, etc.
│   │   ├── billing/            # Subscription, billing
│   │   │   ├── api/
│   │   │   │   └── hooks/
│   │   │   ├── hooks/
│   │   │   ├── model/
│   │   │   │   └── __tests__/
│   │   │   └── ui/
│   │   ├── endplan/             # Core EndPlan: vault, sections, dashboard
│   │   │   ├── api/            # Vault API, mutations, query hooks
│   │   │   │   ├── __tests__/
│   │   │   │   └── hooks/
│   │   │   ├── hooks/          # Page hooks, autosave, setup progress
│   │   │   ├── model/          # Vault section types, asset model
│   │   │   │   └── __tests__/
│   │   │   └── ui/             # Dashboard, vault sections, shared vault UI
│   │   ├── keys/               # Encryption keys (unlock, ensure keys)
│   │   │   ├── api/
│   │   │   │   └── hooks/
│   │   │   ├── hooks/
│   │   │   ├── model/          # Keys store, storage
│   │   │   └── ui/             # Unlock card, encryption-keys-required
│   │   └── trusted-circle/     # Invites, members, roles
│   │       ├── api/
│   │       │   ├── __tests__/
│   │       │   └── hooks/
│   │       ├── hooks/
│   │       ├── model/
│   │       └── ui/             # Role grid, invite modal, role config
│   ├── locales/                # i18n translation files
│   ├── pages/                  # Route-level page components
│   │   ├── billing/
│   │   ├── configure-transfer-process/
│   │   ├── create-endplan/
│   │   ├── dashboard/
│   │   ├── edit-endplan/
│   │   ├── forgot-password/
│   │   ├── invite/
│   │   ├── login/
│   │   ├── settings/
│   │   ├── shared-vault/
│   │   ├── shared-with-me/
│   │   ├── signup/
│   │   ├── trusted-circle/
│   │   ├── vault/              # Vault section pages (assets, documents, etc.)
│   │   └── verify-email/
│   ├── security/               # Security-related utilities
│   │   └── __tests__/
│   ├── shared/                 # Shared code across features
│   │   ├── api/                # API client, base config
│   │   ├── lib/                # Crypto, CN, fetch helpers
│   │   │   └── __tests__/
│   │   └── ui/                 # Design system
│   │       ├── atoms/          # Button, Input, Checkbox, Spinner
│   │       ├── molecules/      # PasswordInput, Toast, ModalOverlay
│   │       ├── organisms/      # Card, Sidebar, Topbar, BottomBar
│   │       │   ├── bottom-bar/
│   │       │   ├── sidebar/
│   │       │   │   └── hooks/
│   │       │   └── topbar/
│   │       └── templates/      # AuthLayout
│   ├── store/                  # Global state (if any)
│   ├── styles/                 # Global CSS, typography
│   ├── types/                  # Global TypeScript declarations
│   ├── index.css               # Global styles entry
│   ├── main.tsx                # App entry
│   └── types.d.ts              # Ambient type references
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── Dockerfile.client
├── Dockerfile.client.dev
├── nginx.conf
├── nginx.conf.template
├── nginx-ssl.conf.template
├── docker-entrypoint.sh
├── ENV.md
└── README.md
```

## Conventions

- **`src/app`** — Routing, layout, providers; app shell only.
- **`src/features`** — Feature slices: `api/`, `hooks/`, `model/`, `ui/` (and `__tests__` where present).
- **`src/pages`** — One folder per route; pages compose features and shared UI.
- **`src/shared`** — Reusable API client, lib utilities, and shared UI (atoms → molecules → organisms → templates).
- **`src/entities`** — Domain entities (e.g. user).
- **`src/assets`** — Static assets; **`public/`** for assets that need stable URLs.
