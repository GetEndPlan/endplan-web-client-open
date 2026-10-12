/** Generated from design/tokens.json — run: npm run tokens:build */
/** @type {Pick<import('tailwindcss').Config['theme'], 'extend'>['extend']} */
export const designTokenTheme = {
  "colors": {
    "ep": {
      "heading": "rgb(var(--ep-heading) / <alpha-value>)",
      "body": "rgb(var(--ep-body) / <alpha-value>)",
      "body-muted": "rgb(var(--ep-body-muted) / <alpha-value>)",
      "primary": {
        "DEFAULT": "rgb(var(--ep-primary) / <alpha-value>)",
        "accent": "rgb(var(--ep-primary-accent) / <alpha-value>)",
        "nav": "rgb(var(--ep-primary-nav) / <alpha-value>)",
        "soft": "rgb(var(--ep-primary-soft) / <alpha-value>)",
        "softer": "rgb(var(--ep-primary-softer) / <alpha-value>)",
        "muted": "rgb(var(--ep-primary-muted) / <alpha-value>)",
        "stroke": "rgb(var(--ep-primary-stroke) / <alpha-value>)",
        "dark": "rgb(var(--ep-primary-dark) / <alpha-value>)",
        "darker": "rgb(var(--ep-primary-darker) / <alpha-value>)"
      },
      "surface": {
        "DEFAULT": "rgb(var(--ep-surface) / <alpha-value>)",
        "subtle": "rgb(var(--ep-surface-subtle) / <alpha-value>)",
        "muted": "rgb(var(--ep-surface-muted) / <alpha-value>)",
        "highlight": "rgb(var(--ep-surface-highlight) / <alpha-value>)",
        "card": "rgb(var(--ep-surface-card) / <alpha-value>)",
        "panel": "var(--ep-surface-panel)"
      },
      "border": {
        "DEFAULT": "rgb(var(--ep-border) / <alpha-value>)",
        "card": "rgb(var(--ep-border-card) / <alpha-value>)",
        "subtle": "var(--ep-border-subtle)"
      },
      "gradient": {
        "start": "rgb(var(--ep-gradient-start) / <alpha-value>)",
        "mid": "rgb(var(--ep-gradient-mid) / <alpha-value>)",
        "end": "rgb(var(--ep-gradient-end) / <alpha-value>)",
        "soft": "rgb(var(--ep-gradient-soft) / <alpha-value>)"
      },
      "dark": {
        "primary": "rgb(var(--ep-dark-primary) / <alpha-value>)",
        "surface": "rgb(var(--ep-dark-surface) / <alpha-value>)"
      },
      "avatar": "rgb(var(--ep-avatar) / <alpha-value>)"
    }
  },
  "fontFamily": {
    "ep": [
      "\"Matter\"",
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "\"Segoe UI\"",
      "sans-serif"
    ]
  },
  "fontSize": {
    "ep-heading-01": [
      "42px",
      {
        "lineHeight": "1.2",
        "letterSpacing": "-0.03em",
        "fontWeight": "400"
      }
    ],
    "ep-heading-02": [
      "30px",
      {
        "lineHeight": "1.2",
        "letterSpacing": "-0.03em",
        "fontWeight": "400"
      }
    ],
    "ep-heading-03": [
      "24px",
      {
        "lineHeight": "1.2",
        "letterSpacing": "-0.01em",
        "fontWeight": "500"
      }
    ],
    "ep-title": [
      "20px",
      {
        "lineHeight": "1.2",
        "fontWeight": "500"
      }
    ],
    "ep-body-01": [
      "16px",
      {
        "lineHeight": "1.5",
        "letterSpacing": "-0.01em",
        "fontWeight": "400"
      }
    ],
    "ep-label": [
      "16px",
      {
        "lineHeight": "1.2",
        "fontWeight": "500"
      }
    ],
    "ep-body-02": [
      "14px",
      {
        "letterSpacing": "-0.01em",
        "fontWeight": "400"
      }
    ],
    "ep-body-03": [
      "14px",
      {
        "lineHeight": "1.2",
        "letterSpacing": "-0.01em",
        "fontWeight": "500"
      }
    ],
    "ep-body-04": [
      "12px",
      {
        "lineHeight": "1.2",
        "letterSpacing": "-0.01em",
        "fontWeight": "400"
      }
    ],
    "ep-caption": [
      "12px",
      {
        "lineHeight": "1.2",
        "fontWeight": "500"
      }
    ]
  },
  "borderRadius": {
    "ep-button": "10px",
    "ep-card": "16px",
    "ep-panel": "12px",
    "ep-pill": "100px",
    "ep-progress": "30px",
    "ep-nav": "16px"
  },
  "boxShadow": {
    "ep-theme-toggle": "-11px 12px 19px rgba(25, 11, 62, 0.2)",
    "ep-dropdown": "0px 8px 28px 0px #bac2ce",
    "ep-dropdown-dark": "0px 8px 28px 0px #323335"
  },
  "spacing": {
    "ep-sidebar": "280px",
    "ep-content-x": "32px",
    "ep-content-y": "40px",
    "ep-section": "30px",
    "ep-card": "20px",
    "ep-nav-item": "16px",
    "ep-button-x": "12px",
    "ep-button-y": "12px",
    "ep-gap-xs": "8px",
    "ep-gap-sm": "12px",
    "ep-gap-md": "16px",
    "ep-gap-lg": "30px"
  }
}
