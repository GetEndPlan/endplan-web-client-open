import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name=\"dangerouslySetInnerHTML\"]',
          message: 'Do not use dangerouslySetInnerHTML directly. Route content through a sanitizer utility first.',
        },
        {
          selector: 'AssignmentExpression[left.property.name=\"innerHTML\"]',
          message: 'Avoid assigning to innerHTML directly for untrusted content.',
        },
        {
          selector: 'AssignmentExpression[left.property.name=\"outerHTML\"]',
          message: 'Avoid assigning to outerHTML directly for untrusted content.',
        },
        {
          selector: 'CallExpression[callee.property.name=\"insertAdjacentHTML\"]',
          message: 'Avoid insertAdjacentHTML for untrusted content.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'write',
          message: 'document.write is disallowed due to XSS risk.',
        },
      ],
    },
  },
])
