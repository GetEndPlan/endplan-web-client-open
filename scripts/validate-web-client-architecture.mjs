#!/usr/bin/env node
/**
 * Lightweight structural checks so refactors (shared view-model types, split UI modules)
 * do not regress into duplicate definitions or misplaced props types.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()

async function readUtf8(relPath) {
  return fs.readFile(path.join(rootDir, relPath), 'utf8')
}

const checks = [
  {
    id: 'vault-instructions-page-shared-model',
    description:
      'Vault instructions page imports shared instruction form + view types; no duplicate option types in the file.',
    file: 'src/features/endplan/ui/instructions/vault-instructions-page.tsx',
    async run(content) {
      const violations = []
      if (!content.includes("from '../../model/instructions-page.types'")) {
        violations.push('Expected import from ../../model/instructions-page.types')
      }
      if (!content.includes("from '../../model/instructions-form-state'")) {
        violations.push('Expected import from ../../model/instructions-form-state')
      }
      for (const marker of [
        'type AssetOption',
        'type DocumentOption',
        'type DocumentFolderOption',
        'type LinkedDocument',
      ]) {
        if (content.includes(marker)) {
          violations.push(`Found duplicate local type marker "${marker}" — use instructions-page.types`)
        }
      }
      return violations
    },
  },
  {
    id: 'vault-instructions-hook-shared-types',
    description: 'useVaultInstructionsPage imports option types from instructions-page.types (single source of truth).',
    file: 'src/features/endplan/hooks/instructions/use-vault-instructions-page.ts',
    async run(content) {
      const violations = []
      if (!content.includes("from '../../model/instructions-page.types'")) {
        violations.push('Expected import from ../../model/instructions-page.types')
      }
      if (!/\bInstructionAssetOption\b/.test(content)) {
        violations.push('Expected InstructionAssetOption symbol in file')
      }
      if (/\btype\s+AssetOption\b/.test(content)) {
        violations.push('Local type AssetOption should not be defined — use InstructionAssetOption from model')
      }
      return violations
    },
  },
  {
    id: 'vault-assets-table-types-module',
    description: 'Vault assets table keeps props/drafts types in vault-assets-table.types.ts.',
    file: 'src/features/endplan/ui/assets/vault-assets-table.tsx',
    async run(content) {
      const violations = []
      if (!content.includes("from './vault-assets-table.types'")) {
        violations.push("Expected import from './vault-assets-table.types'")
      }
      // Inline definition only (ignore `import { type VaultAssetsTableProps }`).
      if (/\btype\s+VaultAssetsTableProps\s*=/.test(content) || /\binterface\s+VaultAssetsTableProps\b/.test(content)) {
        violations.push('VaultAssetsTableProps should be defined only in vault-assets-table.types.ts')
      }
      return violations
    },
  },
]

async function main() {
  const failures = []

  for (const check of checks) {
    let content
    try {
      content = await readUtf8(check.file)
    } catch (err) {
      failures.push({
        id: check.id,
        description: check.description,
        violations: [`Could not read ${check.file}: ${err?.message ?? err}`],
      })
      continue
    }

    const violations = await check.run(content)
    if (violations.length > 0) {
      failures.push({ id: check.id, description: check.description, violations })
    }
  }

  if (failures.length > 0) {
    console.error('Web client architecture validation failed.\n')
    for (const block of failures) {
      console.error(`[${block.id}] ${block.description}`)
      for (const line of block.violations) {
        console.error(`  - ${line}`)
      }
      console.error('')
    }
    process.exit(1)
  }

  console.log('Web client architecture validation passed.')
}

main()
