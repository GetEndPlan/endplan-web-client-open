/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Better Auth base URL. Empty = same origin (nginx proxies `/api/auth/*`). */
  readonly VITE_AUTH_URL?: string
  /** Go API base URL. Empty = same origin (nginx proxies `/api/v1/*`). */
  readonly VITE_API_URL?: string
  /** When `"true"`, initialize Plausible during `npm run dev` (localhost). Production is always on when domain is set. */
  readonly VITE_PLAUSIBLE_ENABLE_IN_DEV?: string
  readonly VITE_PLAUSIBLE_DOMAIN?: string
  /** Optional footer Support link. Omitted from UI when unset. */
  readonly VITE_SUPPORT_URL?: string
  /** Optional footer Terms link. Omitted from UI when unset. */
  readonly VITE_TERMS_URL?: string
  /** Optional footer Privacy link. Omitted from UI when unset. */
  readonly VITE_PRIVACY_URL?: string
  /** Hostname that selects the sys skin. Unset keeps the default skin. */
  readonly VITE_SYS_DEMO_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
