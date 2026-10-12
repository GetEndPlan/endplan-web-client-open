#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')
const extensions = new Set(['.tsx'])

const bannedTokenPattern =
  /(^|[^:A-Za-z0-9_-])((text-(xs|sm|base|lg|xl|2xl|3xl|4xl)|font-(light|normal|medium|semibold|bold)|typo-size-(xs|sm|base|lg|xl|2xl|3xl|4xl)|typo-weight-(light|normal|medium|semibold|bold)))(?=[^A-Za-z0-9_-]|$)/g

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function toRelative(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/')
}

async function main() {
  const files = await walk(srcDir)
  const violations = []

  for (const file of files) {
    const relativePath = toRelative(file)
    const content = await fs.readFile(file, 'utf8')
    const lines = content.split(/\r?\n/)

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      const matches = [...line.matchAll(bannedTokenPattern)]
      if (matches.length === 0) {
        continue
      }

      const tokens = Array.from(new Set(matches.map((match) => match[2])))
      violations.push({
        file: relativePath,
        line: index + 1,
        tokens,
      })
    }
  }

  if (violations.length > 0) {
    console.error('Typography usage check failed. Use semantic typography classes from src/styles/typography.css.')
    for (const violation of violations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.tokens.join(', ')}`)
    }
    process.exit(1)
  }

  console.log('Typography usage check passed.')
}

main().catch((error) => {
  console.error('Typography usage check crashed:', error)
  process.exit(1)
})
