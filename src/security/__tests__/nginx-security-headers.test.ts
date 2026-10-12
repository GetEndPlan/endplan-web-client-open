import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const clientNginxFiles = [
  'nginx.conf',
  'nginx.conf.template',
  'nginx-ssl.conf.template',
] as const

test('web-client nginx configs include core security headers and CSP', () => {
  for (const file of clientNginxFiles) {
    const body = readFileSync(resolve(process.cwd(), file), 'utf8')

    assert.match(body, /add_header X-Content-Type-Options "nosniff" always;/)
    assert.match(body, /add_header X-Frame-Options "DENY" always;/)
    assert.match(body, /add_header Referrer-Policy "strict-origin-when-cross-origin" always;/)
    assert.match(body, /add_header Content-Security-Policy "/)
    assert.match(body, /add_header Content-Security-Policy-Report-Only "/)
  }
})

test('web-client nginx mjs mime config maps .mjs to application/javascript', () => {
  const body = readFileSync(resolve(process.cwd(), 'nginx-mjs-mime.types.conf'), 'utf8')

  assert.match(body, /types \{/)
  assert.match(body, /application\/javascript mjs;/)
})
