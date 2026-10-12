#!/usr/bin/env node
/**
 * Replace dark-mode slate-800 panel surfaces with ep-surface-panel tokens.
 * Run after tokens:build so --ep-surface-panel exists in design-tokens.css.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

/** Longest matches first. */
const replacements = [
  ['dark:bg-slate-900/80', 'dark:bg-ep-primary-dark/80'],
  ['dark:bg-slate-900/70', 'dark:bg-ep-primary-dark/70'],
  ['dark:bg-slate-900/60', 'dark:bg-ep-primary-dark/60'],
  ['dark:bg-slate-900/50', 'dark:bg-ep-surface-panel'],
  ['dark:bg-slate-900/40', 'dark:bg-ep-primary-dark/40'],
  ['dark:bg-slate-900/30', 'dark:bg-ep-primary-dark/30'],
  ['dark:focus:bg-slate-800', 'dark:focus:bg-ep-surface-panel'],
  ['dark:hover:bg-slate-800/50', 'dark:hover:bg-ep-primary-dark/50'],
  ['dark:hover:bg-slate-800', 'dark:hover:bg-ep-surface-panel'],
  ['dark:bg-slate-800/80', 'dark:bg-ep-primary-dark/80'],
  ['dark:bg-slate-800/70', 'dark:bg-ep-primary-dark/70'],
  ['dark:bg-slate-800/60', 'dark:bg-ep-primary-dark/60'],
  ['dark:bg-slate-800/50', 'dark:bg-ep-primary-dark/50'],
  ['dark:bg-slate-800/40', 'dark:bg-ep-primary-dark/40'],
  ['dark:bg-slate-800/30', 'dark:bg-ep-primary-dark/30'],
  ['dark:bg-slate-800', 'dark:bg-ep-surface-panel'],
  ['dark:border-slate-800', 'dark:border-ep-border-card'],
  ['dark:focus:ring-offset-slate-800', 'dark:focus:ring-offset-ep-surface'],
  ['rgb(30 41 59)', 'var(--ep-surface-panel)'],
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue
      walk(full, out)
      continue
    }
    if (/\.(tsx|ts|css)$/.test(entry)) out.push(full)
  }
  return out
}

let changedFiles = 0
for (const filePath of walk(join(root, 'src'))) {
  const original = readFileSync(filePath, 'utf8')
  let next = original
  for (const [from, to] of replacements) {
    next = next.split(from).join(to)
  }
  if (next !== original) {
    writeFileSync(filePath, next)
    changedFiles += 1
  }
}

console.log(`Migrated slate-800 panel surfaces in ${changedFiles} files.`)
