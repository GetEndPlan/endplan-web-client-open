#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')

const tsExtensions = new Set(['.ts', '.tsx'])

const fromQueryAllowedFiles = new Set()

const symbolRules = [
  {
    name: 'useEndPlanStore',
    pattern: /\buseEndPlanStore\b/g,
    allowedFiles: new Set(),
  },
  {
    name: 'useTrustedCircleStore',
    pattern: /\buseTrustedCircleStore\b/g,
    allowedFiles: new Set(),
  },
  {
    name: 'useBillingStore',
    pattern: /\buseBillingStore\b/g,
    allowedFiles: new Set(),
  },
]

const fromQueryPattern = /\bset[A-Za-z0-9_]*FromQuery\b/g

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }
    if (entry.isFile() && tsExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function rel(fullPath) {
  return path.relative(rootDir, fullPath).split(path.sep).join('/')
}

async function main() {
  const files = await walk(srcDir)
  const violations = []

  for (const file of files) {
    const relativePath = rel(file)
    const content = await fs.readFile(file, 'utf8')

    const fromQueryMatches = content.match(fromQueryPattern) ?? []
    if (fromQueryMatches.length > 0 && !fromQueryAllowedFiles.has(relativePath)) {
      violations.push({
        type: 'fromQuery',
        file: relativePath,
        details: `Found FromQuery sync symbols: ${Array.from(new Set(fromQueryMatches)).join(', ')}`,
      })
    }

    for (const rule of symbolRules) {
      const matches = content.match(rule.pattern) ?? []
      if (matches.length > 0 && !rule.allowedFiles.has(relativePath)) {
        violations.push({
          type: 'symbol',
          file: relativePath,
          details: `Found restricted symbol "${rule.name}"`,
        })
      }
    }
  }

  if (violations.length > 0) {
    console.error('State ownership check failed.')
    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.details}`)
    }
    process.exit(1)
  }

  console.log('State ownership check passed.')
}

main().catch((error) => {
  console.error('State ownership check crashed:', error)
  process.exit(1)
})
