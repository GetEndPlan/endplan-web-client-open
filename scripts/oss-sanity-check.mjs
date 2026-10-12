#!/usr/bin/env node
/**
 * Fails if the working tree looks unsafe for a public OSS batch.
 * Run from the web-client root: `npm run oss:sanity`
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
}

const forbiddenPaths = [
  'src/assets/logos/endplan_black.svg',
  'src/assets/logos/endplan_white.svg',
  'src/assets/logos/endplan_symbol_black.svg',
  'src/assets/logos/endplan_symbol_white.svg',
  'src/assets/logos/brand',
  'src/assets/logos/EPS',
  'src/assets/logos/PNG',
  'src/assets/logos/SVG',
  'src/assets/Logo SYS',
  'public/favicon.png',
  'public/favicon-sys-v2.svg',
  'src/assets/favicons',
]

for (const rel of forbiddenPaths) {
  if (existsSync(join(root, rel))) {
    fail(`Forbidden path present: ${rel}`)
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const forbiddenScripts = ['auth:server', 'auth:migrate', 'auth:add-columns', 'dev:all']
for (const name of forbiddenScripts) {
  if (pkg.scripts?.[name]) {
    fail(`Forbidden package.json script: ${name}`)
  }
}

const forbiddenDeps = [
  'express',
  'cors',
  'helmet',
  'express-rate-limit',
  'pg',
  'concurrently',
  '@types/express',
  '@types/cors',
  '@types/pg',
]
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
for (const name of forbiddenDeps) {
  if (allDeps[name]) {
    fail(`Forbidden dependency: ${name}`)
  }
}

if (pkg.private === true) {
  fail('package.json "private" must be false for the public package')
}
if (!pkg.license) {
  fail('package.json missing "license" field')
}

const forbiddenSubstrings = [
  'sys-demo.endplan.com',
  '../endplan-auth-server',
  'https://endplan.com/',
]

const scanRoots = ['src', 'public', 'scripts', 'docs', 'index.html', 'README.md', 'ENV.md', 'package.json']
const textExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.html', '.svg', '.css', '.example'])

function shouldScan(filePath) {
  if (filePath.includes(`${join('docs', 'oss')}`)) return false
  if (filePath.endsWith('oss-sanity-check.mjs')) return false
  if (
    filePath.endsWith('LICENSE') ||
    filePath.endsWith('SECURITY.md') ||
    filePath.endsWith('CONTRIBUTING.md') ||
    filePath.endsWith('README.md')
  ) {
    // Policy docs may name EndPlan trademarks; README is scanned via dedicated allowlist below.
    if (!filePath.endsWith('README.md')) return false
  }
  const lower = filePath.toLowerCase()
  if (lower.endsWith('readme.md') || lower.endsWith('env.md') || lower.endsWith('package.json') || lower.endsWith('index.html')) {
    return true
  }
  const ext = lower.slice(lower.lastIndexOf('.'))
  return textExt.has(ext)
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full)
    else if (shouldScan(full)) {
      const text = readFileSync(full, 'utf8')
      for (const needle of forbiddenSubstrings) {
        if (text.includes(needle)) {
          fail(`Forbidden string "${needle}" in ${relative(root, full)}`)
        }
      }
    }
  }
}

for (const rel of scanRoots) {
  const full = join(root, rel)
  if (!existsSync(full)) continue
  const st = statSync(full)
  if (st.isDirectory()) walk(full)
  else if (shouldScan(full)) {
    const text = readFileSync(full, 'utf8')
    for (const needle of forbiddenSubstrings) {
      if (text.includes(needle)) {
        fail(`Forbidden string "${needle}" in ${rel}`)
      }
    }
  }
}

for (const required of ['LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', '.env.example', '.env.stubs.example', 'stubs/mock-server.mjs']) {
  if (!existsSync(join(root, required))) {
    fail(`Missing required file: ${required}`)
  }
}

if (failures.length > 0) {
  console.error('OSS sanity check failed:\n')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('OSS sanity check passed.')
