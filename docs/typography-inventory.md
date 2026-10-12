# Typography Inventory

This inventory reflects the current codebase after semantic typography migration.

## Primitive typography usage counts in TSX

- `typo-size-*` / `typo-weight-*`: 0

## Semantic typography usage counts

- `typo-body-sm`: 113
- `typo-caption`: 53
- `typo-emphasis`: 34
- `typo-body-sm-strong`: 26
- `typo-heading-page`: 22
- `typo-heading-card`: 18
- `typo-caption-strong`: 11
- `typo-button-md`: 6
- `typo-caption-emphasis`: 5
- `typo-heading-section`: 4
- `typo-body-base-strong`: 3
- `typo-symbol`: 2
- `typo-regular`: 2
- `typo-lead`: 2
- `typo-label`: 2
- `typo-input`: 2
- `typo-heading-subcard`: 2
- `typo-heading-auth-hero`: 2
- `typo-body-sm-emphasis`: 2
- `typo-badge`: 2
- `typo-topbar-user`: 1
- `typo-symbol-display`: 1
- `typo-nav-link`: 1
- `typo-heading-mini`: 1
- `typo-heading-hero`: 1
- `typo-heading-display`: 1
- `typo-heading-accent`: 1
- `typo-button-sm`: 1
- `typo-button-lg`: 1

## Enforcement

- Raw `text-*` / `font-*` and primitive `typo-size-*` / `typo-weight-*` classes are blocked in TSX by `scripts/check-typography-usage.mjs`.
- Run with: `npm run typography:check`
