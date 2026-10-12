# Typography System

This project centralizes typography in `src/styles/typography.css`.

## Global font family

The font family remains unchanged and is defined in `src/index.css`:

- `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

## Semantic-only policy

Typography in TSX is semantic-only. Primitive typography classes were removed from
`src/styles/typography.css` and are not allowed in components.

## Semantic categories

Prefer semantic classes in shared and reusable UI:

- Headings: `typo-heading-page`, `typo-heading-page-static`, `typo-heading-section`, `typo-heading-card`, `typo-heading-subcard`, `typo-heading-mini`, `typo-heading-auth-hero`, `typo-heading-hero`, `typo-heading-display`, `typo-heading-accent`
- Body: `typo-body`, `typo-body-sm`, `typo-body-sm-strong`, `typo-body-sm-emphasis`, `typo-body-base-strong`, `typo-lead`, `typo-caption`, `typo-caption-strong`, `typo-caption-emphasis`, `typo-muted`
- Navigation/Chrome: `typo-nav-link`, `typo-nav-meta`, `typo-topbar-user`
- Forms/Actions: `typo-label`, `typo-input`, `typo-button-sm`, `typo-button-md`, `typo-button-lg`
- Badge/Status: `typo-badge`, `typo-status`
- Inline emphasis: `typo-regular`, `typo-emphasis`, `typo-emphasis-strong`, `typo-emphasis-bold`
- Symbol sizing: `typo-symbol`, `typo-symbol-display`

## Migration mapping

- `text-*`/`font-*` -> semantic `typo-*` classes from this document
- `typo-size-*`/`typo-weight-*` -> semantic `typo-*` classes from this document

## Rules

- Keep `font-family` global and unchanged.
- Do not introduce raw `text-*` or `font-*` size/weight utility classes in TSX.
- Do not introduce `typo-size-*` or `typo-weight-*` classes in TSX.
- Use semantic typography classes only.
