import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'))

const FONT_WEIGHT = {
  Regular: '400',
  Medium: '500',
  SemiBold: '600',
}

function parseLineHeight(value) {
  if (!value || value === 'auto') return undefined
  if (value.endsWith('%')) {
    const ratio = Number.parseFloat(value) / 100
    return String(Math.round(ratio * 1000) / 1000)
  }
  return value
}

function parseLetterSpacing(value) {
  if (!value || value === '0px' || value === '0%') return undefined
  if (value.endsWith('%')) return `${Number.parseFloat(value) / 100}em`
  return value
}

function parsePx(value) {
  if (!value) return null
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim())
  return match ? `${match[1]}px` : null
}

function parsePadding(value) {
  const parts = value.trim().split(/\s+/).map(parsePx).filter(Boolean)
  return parts.length === 4 ? parts : null
}

function extractHexSwatches(spacing) {
  const swatches = {}
  for (const key of Object.keys(spacing)) {
    const match = /^([0-9a-f]{3,8})Size$/i.exec(key)
    if (match) swatches[match[1].toLowerCase()] = `#${match[1].toLowerCase()}`
  }
  return swatches
}

function hexToRgbTriplet(hex) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return null
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** @typedef {{ type: 'rgb', value: string } | { type: 'raw', value: string }} ColorToken */

const swatches = extractHexSwatches(tokens.spacing)

/** @returns {Record<string, ColorToken | Record<string, ColorToken>>} */
function buildLightPalette() {
  return {
    heading: { type: 'rgb', value: tokens.colors.colorLightMode ?? tokens.colors.frame1597880950 ?? '#241645' },
    body: { type: 'rgb', value: tokens.colors.typefaceColors ?? '#000000' },
    'body-muted': { type: 'rgb', value: tokens.colors.matterRegular ?? '#1e1e1e' },
    primary: {
      DEFAULT: { type: 'rgb', value: swatches['7742fa'] ?? '#7742fa' },
      accent: { type: 'rgb', value: swatches['6d4bff'] ?? '#6d4bff' },
      nav: { type: 'rgb', value: swatches['625cf2'] ?? '#625cf2' },
      soft: { type: 'rgb', value: swatches['ddd0fe'] ?? '#ddd0fe' },
      softer: { type: 'rgb', value: swatches['e4d9fe'] ?? '#e4d9fe' },
      muted: { type: 'rgb', value: tokens.colors.vector ?? '#9c86fe' },
      stroke: { type: 'rgb', value: tokens.colors['3dIconStroke'] ?? '#8a38f5' },
      dark: { type: 'rgb', value: tokens.colors.rectangle5800 ?? swatches['2c204a'] ?? '#2c204a' },
      darker: { type: 'rgb', value: swatches['2a1759'] ?? '#2a1759' },
    },
    surface: {
      DEFAULT: { type: 'rgb', value: swatches.ffffff ?? '#ffffff' },
      subtle: { type: 'rgb', value: swatches.f6f9fc ?? '#f6f9fc' },
      muted: { type: 'rgb', value: swatches.f7f8f9 ?? '#f7f8f9' },
      highlight: { type: 'rgb', value: tokens.colors.frame1000004992 ?? '#f1f8ff' },
      card: { type: 'rgb', value: swatches.ffffff ?? '#ffffff' },
      /** Elevated panels (replaces legacy slate-800 surfaces in light mode). */
      panel: { type: 'raw', value: 'rgb(255 255 255)' },
    },
    border: {
      DEFAULT: { type: 'rgb', value: tokens.colors.vector3023Stroke ?? '#e5e5e5' },
      card: { type: 'rgb', value: swatches.e2e8f0 ?? '#e2e8f0' },
      subtle: { type: 'raw', value: 'rgba(0, 0, 0, 0.1)' },
    },
    gradient: {
      start: { type: 'rgb', value: swatches['6fa8ef'] ?? '#6fa8ef' },
      mid: { type: 'rgb', value: swatches['6d4bff'] ?? '#6d4bff' },
      end: { type: 'rgb', value: swatches['4317ff'] ?? '#4317ff' },
      soft: { type: 'rgb', value: swatches.ae96ee ?? '#ae96ee' },
    },
    dark: {
      primary: { type: 'rgb', value: swatches['5630b2'] ?? '#5630b2' },
      surface: { type: 'rgb', value: swatches['3d2b67'] ?? '#3d2b67' },
    },
    avatar: { type: 'rgb', value: tokens.colors.ellipse83 ?? '#d9d9d9' },
  }
}

/** Dark dashboard palette — Figma V1 dark mode (node 366:552)
 *  Shell, cards, and modals share #170C31; borders provide separation. */
function buildDarkPalette() {
  const shell = tokens.colors.darkCanvas ?? swatches['170c31'] ?? '#170c31'

  return {
    heading: { type: 'rgb', value: '#ffffff' },
    body: { type: 'rgb', value: '#ffffff' },
    'body-muted': { type: 'rgb', value: '#ffffff' },
    primary: {
      DEFAULT: { type: 'rgb', value: swatches['5630b2'] ?? '#5630b2' },
      accent: { type: 'rgb', value: swatches['7742fa'] ?? '#7742fa' },
      nav: { type: 'rgb', value: tokens.colors.vector ?? '#9c86fe' },
      soft: { type: 'rgb', value: swatches['5630b2'] ?? '#5630b2' },
      softer: { type: 'rgb', value: swatches['2c204a'] ?? '#2c204a' },
      muted: { type: 'rgb', value: tokens.colors.vector ?? '#9c86fe' },
      stroke: { type: 'rgb', value: tokens.colors['3dIconStroke'] ?? '#8a38f5' },
      dark: { type: 'rgb', value: swatches['2c204a'] ?? '#2c204a' },
      darker: { type: 'rgb', value: shell },
    },
    surface: {
      DEFAULT: { type: 'rgb', value: shell },
      card: { type: 'rgb', value: shell },
      subtle: { type: 'rgb', value: swatches['2c204a'] ?? '#2c204a' },
      muted: { type: 'rgb', value: shell },
      highlight: { type: 'rgb', value: swatches['5630b2'] ?? '#5630b2' },
      /** Elevated panels — #2C204A at 50% (replaces legacy rgb(30 41 59) / slate-800). */
      panel: { type: 'raw', value: '#2C204A80' },
    },
    border: {
      DEFAULT: { type: 'rgb', value: tokens.colors.rectangle835Stroke ?? '#403755' },
      card: { type: 'rgb', value: tokens.colors.rectangle5800Stroke ?? '#2e2446' },
      subtle: { type: 'raw', value: 'rgba(255, 255, 255, 0.1)' },
    },
    gradient: {
      start: { type: 'rgb', value: swatches['6fa8ef'] ?? '#6fa8ef' },
      mid: { type: 'rgb', value: swatches['6d4bff'] ?? '#6d4bff' },
      end: { type: 'rgb', value: swatches['4317ff'] ?? '#4317ff' },
      soft: { type: 'rgb', value: swatches.ae96ee ?? '#ae96ee' },
    },
    dark: {
      primary: { type: 'rgb', value: swatches['5630b2'] ?? '#5630b2' },
      surface: { type: 'rgb', value: shell },
    },
    avatar: { type: 'rgb', value: swatches['403755'] ?? tokens.colors.rectangle835Stroke ?? '#403755' },
  }
}

/** @param {Record<string, ColorToken | Record<string, ColorToken>>} palette @param {string} [prefix] */
function collectColorVars(palette, prefix = 'ep') {
  /** @type {Map<string, ColorToken>} */
  const vars = new Map()

  function walk(node, path) {
    for (const [key, value] of Object.entries(node)) {
      const segment = key === 'DEFAULT' ? path : path ? `${path}-${key}` : key
      if (value && typeof value === 'object' && 'type' in value) {
        vars.set(`--${prefix}-${segment}`, value)
      } else if (value && typeof value === 'object') {
        walk(value, segment)
      }
    }
  }

  walk(palette, '')
  return vars
}

/** @param {ColorToken} token @param {string} cssVar */
function tokenToTailwindValue(token, cssVar) {
  if (token.type === 'raw') return `var(${cssVar})`
  return `rgb(var(${cssVar}) / <alpha-value>)`
}

/** @param {Record<string, ColorToken | Record<string, ColorToken>>} palette */
function paletteToTailwindColors(palette) {
  function walk(node, path) {
    const result = {}
    for (const [key, value] of Object.entries(node)) {
      const segment = key === 'DEFAULT' ? path : path ? `${path}-${key}` : key
      const cssVar = `--ep-${segment}`
      if (value && typeof value === 'object' && 'type' in value) {
        result[key] = tokenToTailwindValue(value, cssVar)
      } else if (value && typeof value === 'object') {
        result[key] = walk(value, segment)
      }
    }
    return result
  }

  return walk(palette, '')
}

/** @param {Map<string, ColorToken>} varMap */
function varsToCssBlock(varMap) {
  const lines = []
  for (const [name, token] of varMap) {
    if (token.type === 'raw') {
      lines.push(`  ${name}: ${token.value};`)
    } else {
      const triplet = hexToRgbTriplet(token.value)
      lines.push(`  ${name}: ${triplet ?? token.value};`)
    }
  }
  return lines.join('\n')
}

const lightPalette = buildLightPalette()
const darkPalette = buildDarkPalette()
const lightVars = collectColorVars(lightPalette)
const darkVars = collectColorVars(darkPalette)

const typographyAliases = {
  colorLightMode: 'ep-heading-01',
  heading02: 'ep-heading-02',
  heading03: 'ep-heading-03',
  matterMedium: 'ep-title',
  loremLorem: 'ep-body-01',
  neutral100: 'ep-label',
  '000000': 'ep-body-02',
  body03: 'ep-body-03',
  body04: 'ep-body-04',
  matterRegular: 'ep-caption',
}

const fontSize = {}

for (const [tokenKey, className] of Object.entries(typographyAliases)) {
  const style = tokens.typography[tokenKey]
  if (!style) continue

  const size = parsePx(style.fontSize)
  if (!size) continue

  const config = {
    lineHeight: parseLineHeight(style.lineHeight),
    letterSpacing: parseLetterSpacing(style.letterSpacing),
    fontWeight: FONT_WEIGHT[style.fontWeight] ?? '400',
  }

  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) delete config[key]
  }

  fontSize[className] = [size, config]
}

const theme = {
  colors: {
    ep: paletteToTailwindColors(lightPalette),
  },
  fontFamily: {
    ep: ['"Matter"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
  },
  fontSize,
  borderRadius: {
    'ep-button': tokens.radii.colorpurpleSize40TypefilledRadius ?? '10px',
    'ep-card': tokens.radii.frame1171274754Radius ?? '16px',
    'ep-panel': tokens.radii.frame1597880953Radius ?? '12px',
    'ep-pill': tokens.radii.toggleThemeRadius ?? '100px',
    'ep-progress': tokens.radii.rectangle829Radius ?? '30px',
    'ep-nav': tokens.radii.linkRadius ?? '16px',
  },
  boxShadow: {
    'ep-theme-toggle': '-11px 12px 19px rgba(25, 11, 62, 0.2)',
    'ep-dropdown': tokens.effects.colorlightModeTypedekstopEffect ?? '0px 8px 28px 0px #bac2ce',
    'ep-dropdown-dark': tokens.effects.colordarkModeTypedekstopEffect ?? '0px 8px 28px 0px #323335',
  },
  spacing: {
    'ep-sidebar': '280px',
    'ep-content-x': '32px',
    'ep-content-y': '40px',
    'ep-section': parsePx(tokens.spacing.frame1618869502Gap) ?? '30px',
    'ep-card': '20px',
    'ep-nav-item': parsePadding(tokens.spacing.linkPadding)?.[0] ?? '12px',
    'ep-button-x': parsePadding(tokens.spacing.colorpurpleSize40TypefilledPadding)?.[1] ?? '12px',
    'ep-button-y': parsePadding(tokens.spacing.colorpurpleSize40TypefilledPadding)?.[0] ?? '12px',
    'ep-gap-xs': '8px',
    'ep-gap-sm': parsePx(tokens.spacing.linkGap) ?? '12px',
    'ep-gap-md': '16px',
    'ep-gap-lg': parsePx(tokens.spacing.frame1618869502Gap) ?? '30px',
  },
}

const stylesDir = join(root, 'src/styles')
mkdirSync(stylesDir, { recursive: true })

const themePath = join(stylesDir, 'design-tokens.theme.js')
const themeFile = `/** Generated from design/tokens.json — run: npm run tokens:build */
/** @type {Pick<import('tailwindcss').Config['theme'], 'extend'>['extend']} */
export const designTokenTheme = ${JSON.stringify(theme, null, 2)}
`
writeFileSync(themePath, themeFile)

const cssPath = join(stylesDir, 'design-tokens.css')
const cssFile = `/** Generated from design/tokens.json — run: npm run tokens:build */
:root {
${varsToCssBlock(lightVars)}
}

.dark {
${varsToCssBlock(darkVars)}
}
`
writeFileSync(cssPath, cssFile)

console.log('Wrote src/styles/design-tokens.theme.js')
console.log('Wrote src/styles/design-tokens.css')
