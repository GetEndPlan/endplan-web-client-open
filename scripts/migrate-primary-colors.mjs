#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

const replacements = [
  ['indigo-950/60', 'ep-primary-darker/60'],
  ['indigo-950/50', 'ep-primary-darker/50'],
  ['indigo-950/40', 'ep-primary-darker/40'],
  ['indigo-950/30', 'ep-primary-darker/30'],
  ['indigo-900/50', 'ep-primary-dark/50'],
  ['indigo-900/30', 'ep-primary-dark/30'],
  ['indigo-900/25', 'ep-primary-dark/25'],
  ['indigo-800/80', 'ep-primary-dark/80'],
  ['indigo-700/80', 'ep-primary-accent/80'],
  ['indigo-700/50', 'ep-primary-accent/50'],
  ['indigo-500/60', 'ep-primary/60'],
  ['indigo-500/30', 'ep-primary/30'],
  ['indigo-500/20', 'ep-primary/20'],
  ['indigo-500/15', 'ep-primary/15'],
  ['indigo-500/10', 'ep-primary/10'],
  ['indigo-50/90', 'ep-primary-softer/90'],
  ['indigo-50/80', 'ep-primary-softer/80'],
  ['indigo-50/40', 'ep-primary-softer/40'],
  ['from-indigo-500', 'from-ep-primary'],
  ['to-purple-600', 'to-ep-primary-accent'],
  ['indigo-950', 'ep-primary-darker'],
  ['indigo-900', 'ep-primary-dark'],
  ['indigo-800', 'ep-primary-dark'],
  ['indigo-700', 'ep-primary-accent'],
  ['indigo-600', 'ep-primary'],
  ['indigo-500', 'ep-primary'],
  ['indigo-400', 'ep-primary-accent'],
  ['indigo-300', 'ep-primary-muted'],
  ['indigo-200', 'ep-primary-soft'],
  ['indigo-100', 'ep-primary-softer'],
  ['indigo-50', 'ep-primary-softer'],
  ['purple-600', 'ep-primary'],
  ['purple-500', 'ep-primary'],
  ['purple-400', 'ep-primary-accent'],
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

console.log(`Migrated primary colors in ${changedFiles} files.`)
