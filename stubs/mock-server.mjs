#!/usr/bin/env node
/**
 * Local mock for the open-source web client.
 *
 * This is NOT endplan-api or endplan-auth-server.
 * It only implements enough HTTP surface for `npm run dev` without private backends.
 *
 * Cookie sessions require auth + API on the SAME origin. Point both:
 *   VITE_AUTH_URL=http://localhost:8080
 *   VITE_API_URL=http://localhost:8080
 */
import { createServer } from 'node:http'
import { randomUUID, timingSafeEqual } from 'node:crypto'

const API_PORT = Number(process.env.MOCK_API_PORT || 8080)
const AUTH_PORT = Number(process.env.MOCK_AUTH_PORT || 3001)
const CORS_ORIGIN = process.env.MOCK_CORS_ORIGIN || 'http://localhost:5173'
const SESSION_COOKIE = 'better-auth.session_token'

const nowIso = () => new Date().toISOString()
const id = () => randomUUID()

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'Demo1234!'

/** In-memory only. Lost on process exit. Never use in production. */
const db = {
  users: new Map(),
  sessions: new Map(),
  keys: new Map(),
  vaults: new Map(),
  sections: new Map(),
  docFolders: new Map(),
  docFiles: new Map(),
  attachments: new Map(),
  assetCategories: new Map(),
  assetFields: new Map(),
  selectedCategories: new Map(),
  policyAttachments: new Map(),
  policyCategories: new Map(),
  policyFields: new Map(),
  selectedPolicyCategories: new Map(),
  vaultAccess: new Map(),
  invitations: new Map(),
  circleMembers: new Map(),
  blobs: new Map(),
  promptStates: new Map(),
  erasure: new Map(),
}

function seedDemoUser() {
  const userId = 'user-demo'
  db.users.set(DEMO_EMAIL, {
    id: userId,
    email: DEMO_EMAIL,
    name: 'Demo User',
    password: DEMO_PASSWORD,
    emailVerified: true,
    phone: null,
    country: null,
    imageUrl: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    onboarding: {
      dashboardWelcomeDismissed: false,
      dashboardWelcomeIntroAcknowledged: false,
      dashboardNavTourSettled: false,
      recoveryPhraseOnboardingCompleted: false,
      recoveryPhraseOnboardingDeferredUntil: null,
      scheduledAccountDeletionWelcomeDismissed: false,
      trialPlanBadgeDismissedKey: null,
    },
    liveness: {
      inactivityPeriodDays: 30,
      reminderIntervalMinutes: 1440,
      lastActiveAt: nowIso(),
      lastReminderAt: null,
      releaseTriggerAt: null,
    },
  })
}

seedDemoUser()

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    image: user.imageUrl,
  }
}

function features() {
  return {
    max_key_persons: 10,
    asset_categories_max: 10,
    policy_categories_max: 10,
    asset_rows_per_category_max: 50,
    documents_folders_max: 50,
    documents_files_max: 100,
    documents_file_size_max_bytes: 25 * 1024 * 1024,
    documents_total_size_max_bytes: 250 * 1024 * 1024,
    instructions_max: 50,
  }
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}

function passwordsEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
  if (!token) return null
  const session = db.sessions.get(token)
  if (!session || session.expiresAt < Date.now()) {
    if (session) db.sessions.delete(token)
    return null
  }
  for (const user of db.users.values()) {
    if (user.id === session.userId) return { user, token, session }
  }
  return null
}

function createSession(userId) {
  const token = id()
  db.sessions.set(token, {
    id: id(),
    userId,
    token,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  return token
}

function sessionCookie(token, clear = false) {
  if (clear) {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  }
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
}

function drainBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readBody(req) {
  return drainBody(req).then((buf) => {
    if (buf.length === 0) return {}
    try {
      return JSON.parse(buf.toString('utf8'))
    } catch {
      return {}
    }
  })
}

function mockUploadUrl(objectId) {
  return `http://127.0.0.1:${API_PORT}/mock-upload/${objectId}`
}

function clearUserVaultData(userId) {
  db.keys.delete(userId)
  for (const [vaultId, vault] of db.vaults) {
    if (vault.ownerId !== userId) continue
    db.vaults.delete(vaultId)
    db.selectedCategories.delete(vaultId)
    for (const [sectionId, section] of db.sections) {
      if (section.vaultId === vaultId) db.sections.delete(sectionId)
    }
    for (const [folderId, folder] of db.docFolders) {
      if (folder.vaultId === vaultId) db.docFolders.delete(folderId)
    }
    for (const [fileId, file] of db.docFiles) {
      if (file.vaultId === vaultId) {
        db.docFiles.delete(fileId)
        db.blobs.delete(fileId)
      }
    }
    for (const [attId, att] of db.attachments) {
      if (att.vaultId === vaultId) {
        db.attachments.delete(attId)
        db.blobs.delete(attId)
      }
    }
    for (const [attId, att] of db.policyAttachments) {
      if (att.vaultId === vaultId) {
        db.policyAttachments.delete(attId)
        db.blobs.delete(attId)
      }
    }
    for (const [catId, cat] of db.assetCategories) {
      if (cat.vaultId === vaultId) db.assetCategories.delete(catId)
    }
    for (const [fieldId, field] of db.assetFields) {
      if (field.vaultId === vaultId) db.assetFields.delete(fieldId)
    }
    for (const [catId, cat] of db.policyCategories) {
      if (cat.vaultId === vaultId) db.policyCategories.delete(catId)
    }
    for (const [fieldId, field] of db.policyFields) {
      if (field.vaultId === vaultId) db.policyFields.delete(fieldId)
    }
    db.selectedCategories.delete(vaultId)
    db.selectedPolicyCategories.delete(vaultId)
    for (const [accessId, row] of db.vaultAccess) {
      if (row.vaultId === vaultId) db.vaultAccess.delete(accessId)
    }
  }
}

function ensureSection(vaultId, sectionType, sectionName) {
  const existing = [...db.sections.values()].find((s) => s.vaultId === vaultId && s.sectionType === sectionType)
  if (existing) return existing
  const section = {
    id: id(),
    vaultId,
    sectionType,
    sectionName,
    displayOrder: 0,
    encryptedData: '',
    encryptionIv: '',
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  db.sections.set(section.id, section)
  return section
}

function assetSchema(vaultId) {
  const categories = [...db.assetCategories.values()]
    .filter((c) => c.vaultId === vaultId)
    .map((c) => ({
      ...c,
      fields: [...db.assetFields.values()].filter((f) => f.categoryTemplateId === c.id),
    }))
  return {
    vaultId,
    categories,
    selectedCategoryIds: db.selectedCategories.get(vaultId) || [],
    assetCategoriesMax: features().asset_categories_max,
    policyCategoriesMax: features().policy_categories_max,
  }
}

function policySchema(vaultId) {
  const categories = [...db.policyCategories.values()]
    .filter((c) => c.vaultId === vaultId)
    .map((c) => ({
      ...c,
      fields: [...db.policyFields.values()].filter((f) => f.categoryTemplateId === c.id),
    }))
  return {
    vaultId,
    categories,
    selectedCategoryIds: db.selectedPolicyCategories.get(vaultId) || [],
    policyCategoriesMax: features().policy_categories_max,
  }
}

const encoder = new TextEncoder()

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64')
}

function fromBase64(b64) {
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

function toArrayBuffer(view) {
  return new Uint8Array(view).buffer
}

let sodiumPromise = null
async function getSodium() {
  if (!sodiumPromise) {
    sodiumPromise = import('libsodium-wrappers-sumo').then(async (mod) => {
      const sodium = 'default' in mod ? mod.default : mod
      await sodium.ready
      return sodium
    })
  }
  return sodiumPromise
}

async function hkdfSha256(ikm, info, length = 32) {
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(ikm), { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: encoder.encode(info) },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

async function encryptAesGcmV1(plaintext, rawKey, aad) {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(rawKey),
    { name: 'AES-GCM', length: rawKey.byteLength * 8 },
    false,
    ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), additionalData: toArrayBuffer(encoder.encode(aad)) },
      key,
      toArrayBuffer(plaintext),
    ),
  )
  return {
    v: 1,
    alg: 'AES-256-GCM',
    ciphertextB64: toBase64(ciphertext),
    ivB64: toBase64(iv),
  }
}

function userHasOwnedVault(userId) {
  return [...db.vaults.values()].some((vault) => vault.ownerId === userId)
}

/**
 * Create a decryptable empty EndPlan once the client has uploaded keys.
 * Uses legacy sealed-box wrapped DEK so the SPA can unwrap without a hybrid envelope.
 */
async function ensureOwnedEndplan(userId, publicKeyB64) {
  if (!userId || !publicKeyB64 || userHasOwnedVault(userId)) return
  const sodium = await getSodium()
  const dek = sodium.randombytes_buf(32)
  const wrappedDek = toBase64(sodium.crypto_box_seal(dek, fromBase64(publicKeyB64)))
  const vaultId = id()
  const createdAt = nowIso()
  const vaultPayload = JSON.stringify({
    content: '',
    title: '',
    createdAt,
    updatedAt: createdAt,
  })
  const vaultKey = await hkdfSha256(dek, 'vault-encryption')
  const vaultEnvelope = await encryptAesGcmV1(
    encoder.encode(vaultPayload),
    vaultKey,
    `vault:${vaultId}|owner:${userId}|type:will|v:1`,
  )
  db.vaults.set(vaultId, {
    id: vaultId,
    ownerId: userId,
    name: 'My EndPlan',
    description: '',
    encryptedData: JSON.stringify(vaultEnvelope),
    encryptionIv: vaultEnvelope.ivB64,
    wrappedDek,
    version: 1,
    createdAt,
    updatedAt: createdAt,
  })

  const sectionSpecs = [
    ['assets', 'Assets', { schemaVersion: 2, categories: [] }],
    ['documents', 'Documents', { folders: [], files: [] }],
    ['instructions', 'Instructions', { items: [] }],
    ['contacts', 'Contacts', { items: [] }],
    ['policies', 'Policies', { schemaVersion: 2, categories: [] }],
  ]
  const sectionKey = await hkdfSha256(dek, 'section-encryption')
  for (let i = 0; i < sectionSpecs.length; i += 1) {
    const [sectionType, sectionName, payload] = sectionSpecs[i]
    const envelope = await encryptAesGcmV1(
      encoder.encode(JSON.stringify(payload)),
      sectionKey,
      `section:${sectionType}|vault:${vaultId}|owner:${userId}|v:1`,
    )
    const section = {
      id: id(),
      vaultId,
      sectionType,
      sectionName,
      displayOrder: i,
      encryptedData: envelope.ciphertextB64,
      encryptionIv: envelope.ivB64,
      version: 1,
      createdAt,
      updatedAt: createdAt,
    }
    db.sections.set(section.id, section)
  }
}

function isLocalDevOrigin(origin) {
  if (!origin) return false
  try {
    const url = new URL(origin)
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.protocol === 'http:' || url.protocol === 'https:')
    )
  } catch {
    return false
  }
}

function corsHeaders(req) {
  const origin = req?.headers?.origin
  const allowOrigin = isLocalDevOrigin(origin) ? origin : CORS_ORIGIN
  const requested = req?.headers?.['access-control-request-headers']
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers':
      requested || 'Content-Type, Authorization, X-Requested-With, Better-Auth-Cookie',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function send(res, status, body, extraHeaders = {}) {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(res.__req),
    ...extraHeaders,
  })
  res.end(payload)
}

function sendNoContent(res, extraHeaders = {}) {
  res.writeHead(204, {
    ...corsHeaders(res.__req),
    ...extraHeaders,
  })
  res.end()
}

function unauthorized(res) {
  send(res, 401, { message: 'Unauthorized' })
}

function notFound(res, message = 'Not found') {
  send(res, 404, { message })
}

function requireUser(req, res) {
  const ctx = userFromRequest(req)
  if (!ctx) {
    unauthorized(res)
    return null
  }
  return ctx
}

function vaultOwnedBy(userId, vaultId) {
  const vault = db.vaults.get(vaultId)
  if (!vault || vault.ownerId !== userId) return null
  return vault
}

async function handle(req, res) {
  res.__req = req
  if (req.method === 'OPTIONS') {
    sendNoContent(res)
    return
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1')
  const path = url.pathname
  const method = req.method || 'GET'

  try {
    if (await handleMockBlob(req, res, method, path)) return
    if (await handleAuth(req, res, method, path)) return
    if (await handleApi(req, res, method, path, url)) return
    send(res, 404, { message: `No mock route for ${method} ${path}`, code: 'not_implemented' })
  } catch (err) {
    console.error(err)
    send(res, 500, { message: 'Mock server error' })
  }
}

async function handleMockBlob(req, res, method, path) {
  const match = path.match(/^\/mock-upload\/([^/]+)$/)
  if (!match) return false
  const objectId = match[1]
  if (method === 'PUT') {
    const buf = await drainBody(req)
    db.blobs.set(objectId, buf)
    send(res, 200, { ok: true, bytes: buf.length })
    return true
  }
  if (method === 'GET') {
    const buf = db.blobs.get(objectId)
    if (!buf) {
      notFound(res, 'Upload not found')
      return true
    }
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      ...corsHeaders(res.__req),
      'Content-Length': buf.length,
    })
    res.end(buf)
    return true
  }
  return false
}

async function handleAuth(req, res, method, path) {
  if (!path.startsWith('/api/auth')) return false

  if (method === 'GET' && path === '/api/auth/get-session') {
    const ctx = userFromRequest(req)
    if (!ctx) {
      send(res, 200, null)
      return true
    }
    send(res, 200, {
      session: {
        id: ctx.session.id,
        userId: ctx.user.id,
        expiresAt: new Date(ctx.session.expiresAt).toISOString(),
        token: ctx.token,
        createdAt: ctx.session.createdAt,
        updatedAt: ctx.session.updatedAt,
      },
      user: publicUser(ctx.user),
    })
    return true
  }

  if (method === 'POST' && path === '/api/auth/sign-in/email') {
    const body = await readBody(req)
    const user = db.users.get(String(body.email || '').toLowerCase())
    if (!user || !passwordsEqual(user.password, body.password || '')) {
      send(res, 401, { message: 'Invalid email or password', code: 'INVALID_EMAIL_OR_PASSWORD' })
      return true
    }
    const token = createSession(user.id)
    send(
      res,
      200,
      { user: publicUser(user), token, redirect: false },
      { 'Set-Cookie': sessionCookie(token) },
    )
    return true
  }

  if (method === 'POST' && path === '/api/auth/sign-up/email') {
    const body = await readBody(req)
    const email = String(body.email || '').toLowerCase()
    if (!email || !body.password || !body.name) {
      send(res, 400, { message: 'Email, password, and name are required', code: 'INVALID_BODY' })
      return true
    }
    if (db.users.has(email)) {
      send(res, 422, { message: 'User already exists', code: 'USER_ALREADY_EXISTS' })
      return true
    }
    const user = {
      id: id(),
      email,
      name: String(body.name),
      password: String(body.password),
      emailVerified: true,
      phone: null,
      country: null,
      imageUrl: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      onboarding: {
        dashboardWelcomeDismissed: false,
        dashboardWelcomeIntroAcknowledged: false,
        dashboardNavTourSettled: false,
        recoveryPhraseOnboardingCompleted: false,
        recoveryPhraseOnboardingDeferredUntil: null,
        scheduledAccountDeletionWelcomeDismissed: false,
        trialPlanBadgeDismissedKey: null,
      },
      liveness: {
        inactivityPeriodDays: 30,
        reminderIntervalMinutes: 1440,
        lastActiveAt: nowIso(),
        lastReminderAt: null,
        releaseTriggerAt: null,
      },
    }
    db.users.set(email, user)
    const token = createSession(user.id)
    send(
      res,
      200,
      { user: publicUser(user), token, redirect: false },
      { 'Set-Cookie': sessionCookie(token) },
    )
    return true
  }

  if (method === 'POST' && path === '/api/auth/sign-out') {
    const ctx = userFromRequest(req)
    if (ctx) db.sessions.delete(ctx.token)
    send(res, 200, { success: true }, { 'Set-Cookie': sessionCookie('', true) })
    return true
  }

  if (method === 'POST' && path === '/api/auth/reset-password-with-code') {
    const body = await readBody(req)
    const user = db.users.get(String(body.email || '').toLowerCase())
    if (!user) {
      send(res, 200, { message: 'If the account exists, the password was reset' })
      return true
    }
    user.password = String(body.newPassword || user.password)
    user.updatedAt = nowIso()
    send(res, 200, { message: 'Password reset' })
    return true
  }

  if (method === 'POST' && (path === '/api/auth/forget-password' || path === '/api/auth/request-password-reset')) {
    send(res, 200, { status: true, message: 'Mock: no email is sent. Use any code with reset-password-with-code.' })
    return true
  }

  send(res, 404, { message: `Auth mock has no handler for ${method} ${path}`, code: 'not_implemented' })
  return true
}

async function handleApi(req, res, method, path, url) {
  if (!path.startsWith('/api/v1')) return false

  const ctx = requireUser(req, res)
  if (!ctx) return true
  const { user } = ctx
  const body = method === 'GET' || method === 'DELETE' ? {} : await readBody(req)

  if (method === 'GET' && path === '/api/v1/user/profile') {
    send(res, 200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        phone: user.phone,
        country: user.country,
        imageUrl: user.imageUrl,
      },
      onboarding: user.onboarding,
    })
    return true
  }

  if (method === 'PATCH' && path === '/api/v1/user/profile') {
    if (body.name != null) user.name = String(body.name)
    if (body.phone != null) user.phone = String(body.phone)
    if (body.country != null) user.country = String(body.country)
    user.updatedAt = nowIso()
    send(res, 200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        phone: user.phone,
        country: user.country,
        imageUrl: user.imageUrl,
      },
      onboarding: user.onboarding,
    })
    return true
  }

  if (method === 'POST' && path === '/api/v1/user/profile/avatar') {
    send(res, 200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        phone: user.phone,
        country: user.country,
        imageUrl: user.imageUrl,
      },
      onboarding: user.onboarding,
    })
    return true
  }

  if (method === 'PATCH' && path === '/api/v1/user/onboarding-state') {
    user.onboarding = { ...user.onboarding, ...body }
    if (body.clearTrialPlanBadgeDismissed) user.onboarding.trialPlanBadgeDismissedKey = null
    send(res, 200, { onboarding: user.onboarding })
    return true
  }

  if (method === 'GET' && path === '/api/v1/user/liveness') {
    send(res, 200, user.liveness)
    return true
  }

  if (method === 'PATCH' && path === '/api/v1/user/liveness') {
    user.liveness = { ...user.liveness, ...body, lastActiveAt: nowIso() }
    send(res, 200, user.liveness)
    return true
  }

  if (method === 'POST' && path === '/api/v1/user/ensure-post-reset-cleanup') {
    send(res, 200, { ok: true, cleanupRun: false })
    return true
  }

  if (method === 'POST' && path === '/api/v1/user/start-fresh-crypto') {
    clearUserVaultData(user.id)
    send(res, 200, { ok: true })
    return true
  }

  const promptGet = path.match(/^\/api\/v1\/user\/prompt-states\/([^/]+)$/)
  if (method === 'GET' && promptGet) {
    const promptKey = decodeURIComponent(promptGet[1])
    const key = `${user.id}:${promptKey}`
    send(res, 200, db.promptStates.get(key) || { promptKey, startedAt: null, dismissedAt: null })
    return true
  }
  const promptAction = path.match(/^\/api\/v1\/user\/prompt-states\/([^/]+)\/(start|dismiss)$/)
  if (method === 'POST' && promptAction) {
    const promptKey = decodeURIComponent(promptAction[1])
    const action = promptAction[2]
    const key = `${user.id}:${promptKey}`
    const current = db.promptStates.get(key) || { promptKey, startedAt: null, dismissedAt: null }
    if (action === 'start') current.startedAt = nowIso()
    if (action === 'dismiss') current.dismissedAt = nowIso()
    db.promptStates.set(key, current)
    send(res, 200, current)
    return true
  }

  if (method === 'GET' && path === '/api/v1/user/erasure-requests') {
    send(res, 200, { requests: db.erasure.get(user.id) || [] })
    return true
  }
  if (method === 'POST' && path === '/api/v1/user/erasure-requests') {
    const request = {
      id: id(),
      userId: user.id,
      kind: body.kind || 'endplan_data',
      status: 'scheduled',
      scheduledExecuteAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      gracePeriodDays: 14,
      attemptCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    const list = db.erasure.get(user.id) || []
    list.push(request)
    db.erasure.set(user.id, list)
    send(res, 200, {
      request,
      scheduledExecuteAt: request.scheduledExecuteAt,
      gracePeriodDays: 14,
      confirmationEmailTo: user.email,
    })
    return true
  }
  const cancelErasure = path.match(/^\/api\/v1\/user\/erasure-requests\/([^/]+)\/cancel$/)
  if (method === 'POST' && cancelErasure) {
    const list = db.erasure.get(user.id) || []
    const row = list.find((r) => r.id === cancelErasure[1])
    if (row) {
      row.status = 'cancelled'
      row.cancelledAt = nowIso()
      row.updatedAt = nowIso()
    }
    sendNoContent(res)
    return true
  }

  if (path.startsWith('/api/v1/verification/')) {
    if (method === 'POST' && (path.endsWith('/send') || path.endsWith('/resend'))) {
      send(res, 200, { message: 'Mock: no email sent. Any code is accepted.', expiresIn: 600 })
      return true
    }
    if (method === 'POST' && (path.endsWith('/verify') || path.endsWith('/check'))) {
      send(res, 200, {
        verified: true,
        message: 'Verified (mock)',
        userId: user.id,
        type: body.type || 'email',
      })
      return true
    }
  }

  if (method === 'GET' && path === '/api/v1/keys') {
    const keys = db.keys.get(user.id)
    if (!keys) {
      notFound(res, 'Keys not found')
      return true
    }
    try {
      await ensureOwnedEndplan(user.id, keys.publicKeyB64)
    } catch (err) {
      console.error('Mock failed to seed EndPlan after key fetch:', err)
    }
    send(res, 200, keys)
    return true
  }
  if (method === 'POST' && (path === '/api/v1/keys' || path === '/api/v1/keys/rotate')) {
    const keys = {
      id: id(),
      userId: user.id,
      publicKeyB64: body.publicKeyB64,
      kekSaltB64: body.kekSaltB64,
      kekIterations: body.kekIterations,
      kekMemorySize: body.kekMemorySize,
      kekParallelism: body.kekParallelism,
      kekHashLength: body.kekHashLength,
      recoveryKekSaltB64: body.recoveryKekSaltB64,
      recoveryKekIterations: body.recoveryKekIterations,
      recoveryKekMemorySize: body.recoveryKekMemorySize,
      recoveryKekParallelism: body.recoveryKekParallelism,
      recoveryKekHashLength: body.recoveryKekHashLength,
      recoveryKdfAlgorithm: body.recoveryKdfAlgorithm,
      hasRecoveryWrap: Boolean(body.recoveryKekSaltB64),
      keyAlgorithm: body.keyAlgorithm || 'x25519',
      keyBundleVersion: body.keyBundleVersion || 1,
      passwordKdfAlgorithm: body.passwordKdfAlgorithm,
      pqPublicKeyB64: body.pqPublicKeyB64 ?? null,
      pqKeyAlgorithm: body.pqKeyAlgorithm ?? null,
      keySlots: body.keySlots || [],
      isCurrent: true,
      createdAt: nowIso(),
      rotatedAt: path.endsWith('/rotate') ? nowIso() : null,
    }
    db.keys.set(user.id, keys)
    try {
      await ensureOwnedEndplan(user.id, keys.publicKeyB64)
    } catch (err) {
      console.error('Mock failed to seed EndPlan after key upload:', err)
    }
    send(res, 200, keys)
    return true
  }
  if (method === 'POST' && path === '/api/v1/keys/public-bundles') {
    const userIds = Array.isArray(body.userIds) ? body.userIds : []
    const keys = []
    for (const uid of userIds) {
      const stored = [...db.keys.values()].find((k) => k.userId === uid)
      if (stored) {
        keys.push({
          userId: uid,
          publicKeyB64: stored.publicKeyB64,
          keyAlgorithm: stored.keyAlgorithm,
          keyBundleVersion: stored.keyBundleVersion,
          pqPublicKeyB64: stored.pqPublicKeyB64,
          pqKeyAlgorithm: stored.pqKeyAlgorithm,
          keySlots: (stored.keySlots || []).map((s) => ({ algorithm: s.algorithm, publicKeyB64: s.publicKeyB64 })),
        })
      }
    }
    send(res, 200, { keys })
    return true
  }
  const publicKey = path.match(/^\/api\/v1\/keys\/([^/]+)\/public$/)
  if (method === 'GET' && publicKey) {
    const stored = [...db.keys.values()].find((k) => k.userId === publicKey[1])
    if (!stored) {
      notFound(res, 'Public key not found')
      return true
    }
    send(res, 200, {
      userId: publicKey[1],
      publicKeyB64: stored.publicKeyB64,
      keyAlgorithm: stored.keyAlgorithm,
      keyBundleVersion: stored.keyBundleVersion,
      pqPublicKeyB64: stored.pqPublicKeyB64,
      pqKeyAlgorithm: stored.pqKeyAlgorithm,
      keySlots: (stored.keySlots || []).map((s) => ({ algorithm: s.algorithm, publicKeyB64: s.publicKeyB64 })),
    })
    return true
  }

  if (method === 'GET' && path === '/api/v1/billing/products') {
    send(res, 200, {
      products: [
        {
          id: 'mock-basic-month',
          name: 'Basic',
          description: 'Mock plan',
          priceAmount: 0,
          priceCurrency: 'usd',
          billingInterval: 'month',
          tier: 'basic',
        },
        {
          id: 'mock-pro-month',
          name: 'Pro',
          description: 'Mock plan',
          priceAmount: 0,
          priceCurrency: 'usd',
          billingInterval: 'month',
          tier: 'pro',
        },
      ],
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/billing/subscription') {
    const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString()
    send(res, 200, {
      subscription: {
        id: 'sub-mock',
        status: 'active',
        tier: 'pro',
        billingInterval: 'month',
        currentPeriodStart: nowIso(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      hasActiveSubscription: true,
      canAccess: true,
      inTrial: false,
      trialEndsAt: null,
      keyPersonBillingPendingAck: false,
      features: features(),
    })
    return true
  }
  if (method === 'POST' && path === '/api/v1/billing/checkout') {
    send(res, 200, { checkoutUrl: `${CORS_ORIGIN}/billing/success`, checkoutId: 'chk-mock' })
    return true
  }
  if (method === 'GET' && path === '/api/v1/billing/portal') {
    send(res, 200, { portalUrl: `${CORS_ORIGIN}/settings` })
    return true
  }
  if (method === 'POST' && path === '/api/v1/billing/cancel') {
    send(res, 200, { message: 'Canceled (mock)', canceledAt: nowIso(), periodEnd: nowIso() })
    return true
  }
  if (method === 'POST' && path === '/api/v1/billing/key-person/acknowledge-free') {
    send(res, 200, { ok: true })
    return true
  }

  if (method === 'GET' && path === '/api/v1/vaults') {
    const storedKeys = db.keys.get(user.id)
    if (storedKeys?.publicKeyB64) {
      try {
        await ensureOwnedEndplan(user.id, storedKeys.publicKeyB64)
      } catch (err) {
        console.error('Mock failed to seed EndPlan:', err)
      }
    }
    const vaults = [...db.vaults.values()]
      .filter((v) => v.ownerId === user.id)
      .map(({ encryptedData, wrappedDek, ...rest }) => rest)
    send(res, 200, { vaults })
    return true
  }
  if (method === 'GET' && path === '/api/v1/shared-vaults') {
    send(res, 200, { vaults: [] })
    return true
  }
  if (method === 'POST' && path === '/api/v1/vaults') {
    const vault = {
      id: id(),
      ownerId: user.id,
      name: body.name || 'My EndPlan',
      description: body.description || '',
      encryptedData: body.encryptedData,
      encryptionIv: body.encryptionIv,
      wrappedDek: body.wrappedDek,
      wrappedDekReleaseB64: body.wrappedDekReleaseB64,
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    db.vaults.set(vault.id, vault)
    send(res, 200, vault)
    return true
  }

  const vaultIdMatch = path.match(/^\/api\/v1\/vaults\/([^/]+)(?:\/(.*))?$/)
  if (vaultIdMatch) {
    const vaultId = vaultIdMatch[1]
    const rest = vaultIdMatch[2] || ''
    const vault = vaultOwnedBy(user.id, vaultId)
    if (!vault && method !== 'GET') {
      notFound(res, 'Vault not found')
      return true
    }
    if (!rest) {
      if (!vault) {
        notFound(res, 'Vault not found')
        return true
      }
      if (method === 'GET') {
        send(res, 200, vault)
        return true
      }
      if (method === 'PUT') {
        Object.assign(vault, body, { updatedAt: nowIso(), version: vault.version + 1 })
        send(res, 200, vault)
        return true
      }
      if (method === 'DELETE') {
        db.vaults.delete(vaultId)
        for (const [sectionId, section] of db.sections) {
          if (section.vaultId === vaultId) db.sections.delete(sectionId)
        }
        sendNoContent(res)
        return true
      }
    }

    if (rest === 'sections') {
      if (!vault) {
        notFound(res, 'Vault not found')
        return true
      }
      if (method === 'GET') {
        send(res, 200, {
          sections: [...db.sections.values()].filter((s) => s.vaultId === vaultId),
        })
        return true
      }
      if (method === 'POST') {
        const section = {
          id: id(),
          vaultId,
          sectionType: body.sectionType,
          sectionName: body.sectionName,
          displayOrder: body.displayOrder ?? 0,
          encryptedData: body.encryptedData,
          encryptionIv: body.encryptionIv,
          version: 1,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        db.sections.set(section.id, section)
        send(res, 200, section)
        return true
      }
    }

    const sectionMatch = rest.match(/^sections\/([^/]+)$/)
    if (sectionMatch && vault) {
      const section = db.sections.get(sectionMatch[1])
      if (!section || section.vaultId !== vaultId) {
        notFound(res, 'Section not found')
        return true
      }
      if (method === 'GET') {
        send(res, 200, section)
        return true
      }
      if (method === 'PUT') {
        Object.assign(section, body, { updatedAt: nowIso(), version: section.version + 1 })
        send(res, 200, section)
        return true
      }
      if (method === 'DELETE') {
        db.sections.delete(section.id)
        sendNoContent(res)
        return true
      }
    }

    if (rest === 'instructions' && vault) {
      let section = [...db.sections.values()].find((s) => s.vaultId === vaultId && s.sectionType === 'instructions')
      if (method === 'GET') {
        if (!section) {
          notFound(res, 'Instructions not found')
          return true
        }
        send(res, 200, section)
        return true
      }
      if (method === 'PUT') {
        if (!section) {
          section = {
            id: id(),
            vaultId,
            sectionType: 'instructions',
            sectionName: 'Instructions',
            displayOrder: 0,
            encryptedData: body.encryptedData,
            encryptionIv: body.encryptionIv,
            version: 1,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          db.sections.set(section.id, section)
        } else {
          Object.assign(section, body, { updatedAt: nowIso(), version: section.version + 1 })
        }
        send(res, 200, section)
        return true
      }
      if (method === 'DELETE' && section) {
        db.sections.delete(section.id)
        sendNoContent(res)
        return true
      }
    }

    if (rest === 'documents/tree' && vault && method === 'GET') {
      const docs = ensureSection(vaultId, 'documents', 'Documents')
      send(res, 200, {
        vaultId,
        sectionId: docs.id,
        folders: [...db.docFolders.values()].filter((f) => f.vaultId === vaultId),
        files: [...db.docFiles.values()].filter((f) => f.vaultId === vaultId),
      })
      return true
    }

    if (rest === 'documents/folders' && vault && method === 'POST') {
      const docs = ensureSection(vaultId, 'documents', 'Documents')
      const folder = {
        id: id(),
        vaultId,
        sectionId: docs.id,
        parentFolderId: body.parentFolderId || null,
        encryptedName: body.encryptedName,
        nameIv: body.nameIv,
        sortOrder: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.docFolders.set(folder.id, folder)
      send(res, 200, folder)
      return true
    }

    const folderMatch = rest.match(/^documents\/folders\/([^/]+)$/)
    if (folderMatch && vault) {
      const folder = db.docFolders.get(folderMatch[1])
      if (!folder || folder.vaultId !== vaultId) {
        notFound(res, 'Folder not found')
        return true
      }
      if (method === 'PATCH') {
        Object.assign(folder, body, { updatedAt: nowIso() })
        send(res, 200, folder)
        return true
      }
      if (method === 'DELETE') {
        const folderIds = new Set([folder.id])
        let grew = true
        while (grew) {
          grew = false
          for (const child of db.docFolders.values()) {
            if (child.vaultId === vaultId && folderIds.has(child.parentFolderId) && !folderIds.has(child.id)) {
              folderIds.add(child.id)
              grew = true
            }
          }
        }
        let deletedFiles = 0
        for (const [fileId, file] of db.docFiles) {
          if (file.vaultId === vaultId && folderIds.has(file.folderId)) {
            db.docFiles.delete(fileId)
            db.blobs.delete(fileId)
            deletedFiles += 1
          }
        }
        for (const folderId of folderIds) db.docFolders.delete(folderId)
        send(res, 200, { deletedFolders: folderIds.size, deletedFiles })
        return true
      }
    }

    if (rest === 'documents/files/init-upload' && vault && method === 'POST') {
      const docs = ensureSection(vaultId, 'documents', 'Documents')
      const file = {
        id: id(),
        vaultId,
        sectionId: docs.id,
        folderId: body.folderId || null,
        encryptedName: body.encryptedName,
        nameIv: body.nameIv,
        mimeType: body.mimeType || null,
        originalSizeBytes: body.originalSizeBytes || 0,
        encryptedSizeBytes: null,
        fileIv: null,
        isUploaded: false,
        uploadedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.docFiles.set(file.id, file)
      send(res, 200, { file, uploadUrl: mockUploadUrl(file.id) })
      return true
    }

    const fileMatch = rest.match(/^documents\/files\/([^/]+)(?:\/(.*))?$/)
    if (fileMatch && vault) {
      const file = db.docFiles.get(fileMatch[1])
      if (!file || file.vaultId !== vaultId) {
        notFound(res, 'File not found')
        return true
      }
      const fileRest = fileMatch[2] || ''
      if (!fileRest && method === 'PATCH') {
        Object.assign(file, body, { updatedAt: nowIso() })
        send(res, 200, file)
        return true
      }
      if (!fileRest && method === 'DELETE') {
        db.docFiles.delete(file.id)
        db.blobs.delete(file.id)
        sendNoContent(res)
        return true
      }
      if (fileRest === 'complete' && method === 'POST') {
        file.fileIv = body.fileIv
        file.encryptedSizeBytes = body.encryptedSizeBytes
        file.isUploaded = true
        file.uploadedAt = nowIso()
        file.updatedAt = nowIso()
        send(res, 200, file)
        return true
      }
      if (fileRest === 'download-url' && method === 'GET') {
        send(res, 200, { file, downloadUrl: mockUploadUrl(file.id) })
        return true
      }
    }

    if (rest === 'assets/schema' && vault && method === 'GET') {
      send(res, 200, assetSchema(vaultId))
      return true
    }

    if (rest === 'assets/categories' && vault && method === 'PUT') {
      db.selectedCategories.set(vaultId, body.categoryTemplateIds || [])
      send(res, 200, { selectedCategoryIds: db.selectedCategories.get(vaultId) })
      return true
    }

    if (rest === 'assets/categories/custom' && vault && method === 'POST') {
      const category = {
        id: id(),
        vaultId,
        key: `custom_${id().slice(0, 8)}`,
        name: body.name || 'Custom category',
        description: '',
        displayOrder: [...db.assetCategories.values()].filter((c) => c.vaultId === vaultId).length,
        isActive: true,
        source: 'custom',
        isSelected: true,
        fields: [],
      }
      db.assetCategories.set(category.id, category)
      const selected = db.selectedCategories.get(vaultId) || []
      selected.push(category.id)
      db.selectedCategories.set(vaultId, selected)
      send(res, 200, { category, selectedCategoryIds: selected })
      return true
    }

    const assetCustomCatMatch = rest.match(/^assets\/categories\/custom\/([^/]+)$/)
    if (assetCustomCatMatch && vault) {
      const category = db.assetCategories.get(assetCustomCatMatch[1])
      if (!category || category.vaultId !== vaultId) {
        notFound(res, 'Category not found')
        return true
      }
      if (method === 'PATCH') {
        if (body.name != null) category.name = body.name
        if (body.description != null) category.description = body.description
        send(res, 200, { category, selectedCategoryIds: db.selectedCategories.get(vaultId) || [] })
        return true
      }
      if (method === 'DELETE') {
        db.assetCategories.delete(category.id)
        for (const [fieldId, field] of db.assetFields) {
          if (field.categoryTemplateId === category.id) db.assetFields.delete(fieldId)
        }
        const selected = (db.selectedCategories.get(vaultId) || []).filter((cid) => cid !== category.id)
        db.selectedCategories.set(vaultId, selected)
        send(res, 200, { selectedCategoryIds: selected })
        return true
      }
    }

    if (rest === 'assets/custom-fields' && vault && method === 'POST') {
      const field = {
        id: id(),
        vaultId,
        categoryTemplateId: body.categoryTemplateId,
        key: body.key || `field_${id().slice(0, 8)}`,
        label: body.label || 'Field',
        fieldType: body.fieldType || 'text',
        required: Boolean(body.required),
        displayOrder: body.displayOrder ?? 0,
        options: body.options,
        isActive: true,
        source: 'custom',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.assetFields.set(field.id, field)
      send(res, 200, field)
      return true
    }

    const assetFieldMatch = rest.match(/^assets\/fields\/([^/]+)$/)
    if (assetFieldMatch && vault && method === 'PATCH') {
      const field = db.assetFields.get(assetFieldMatch[1])
      if (!field || field.vaultId !== vaultId) {
        notFound(res, 'Field not found')
        return true
      }
      if (body.label != null) field.label = body.label
      field.updatedAt = nowIso()
      send(res, 200, field)
      return true
    }

    const customFieldDel = rest.match(/^assets\/custom-fields\/([^/]+)$/)
    if (customFieldDel && vault && method === 'DELETE') {
      const field = db.assetFields.get(customFieldDel[1])
      if (field && field.vaultId === vaultId) db.assetFields.delete(field.id)
      sendNoContent(res)
      return true
    }

    if (rest === 'assets/attachments' && vault && method === 'GET') {
      const assets = ensureSection(vaultId, 'assets', 'Assets')
      send(res, 200, {
        vaultId,
        sectionId: assets.id,
        attachments: [...db.attachments.values()].filter((a) => a.vaultId === vaultId),
      })
      return true
    }

    if (rest === 'assets/attachments/init-upload' && vault && method === 'POST') {
      const assets = ensureSection(vaultId, 'assets', 'Assets')
      const attachment = {
        id: id(),
        vaultId,
        sectionId: assets.id,
        categoryTemplateId: body.categoryTemplateId,
        rowId: body.rowId,
        fieldKey: body.fieldKey,
        encryptedName: body.encryptedName,
        nameIv: body.nameIv,
        mimeType: body.mimeType || null,
        originalSizeBytes: body.originalSizeBytes || 0,
        encryptedSizeBytes: null,
        fileIv: null,
        isUploaded: false,
        uploadedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.attachments.set(attachment.id, attachment)
      send(res, 200, { attachment, uploadUrl: mockUploadUrl(attachment.id) })
      return true
    }

    const attMatch = rest.match(/^assets\/attachments\/([^/]+)(?:\/(.*))?$/)
    if (attMatch && vault) {
      const attachment = db.attachments.get(attMatch[1])
      if (!attachment || attachment.vaultId !== vaultId) {
        notFound(res, 'Attachment not found')
        return true
      }
      const attRest = attMatch[2] || ''
      if (attRest === 'complete' && method === 'POST') {
        attachment.fileIv = body.fileIv
        attachment.encryptedSizeBytes = body.encryptedSizeBytes
        attachment.isUploaded = true
        attachment.uploadedAt = nowIso()
        attachment.updatedAt = nowIso()
        send(res, 200, attachment)
        return true
      }
      if (attRest === 'download-url' && method === 'GET') {
        send(res, 200, { attachment, downloadUrl: mockUploadUrl(attachment.id) })
        return true
      }
      if (!attRest && method === 'DELETE') {
        db.attachments.delete(attachment.id)
        db.blobs.delete(attachment.id)
        sendNoContent(res)
        return true
      }
    }

    if (rest === 'policies/schema' && vault && method === 'GET') {
      send(res, 200, policySchema(vaultId))
      return true
    }

    if (rest === 'policies/categories' && vault && method === 'PUT') {
      db.selectedPolicyCategories.set(vaultId, body.categoryTemplateIds || [])
      send(res, 200, { selectedCategoryIds: db.selectedPolicyCategories.get(vaultId) })
      return true
    }

    if (rest === 'policies/categories/custom' && vault && method === 'POST') {
      const category = {
        id: id(),
        vaultId,
        key: `policy_custom_${id().slice(0, 8)}`,
        name: body.name || 'Custom category',
        description: '',
        displayOrder: [...db.policyCategories.values()].filter((c) => c.vaultId === vaultId).length,
        isActive: true,
        source: 'custom',
        isSelected: true,
        fields: [],
      }
      db.policyCategories.set(category.id, category)
      const selected = db.selectedPolicyCategories.get(vaultId) || []
      selected.push(category.id)
      db.selectedPolicyCategories.set(vaultId, selected)
      send(res, 200, { category, selectedCategoryIds: selected })
      return true
    }

    const policyCustomCatMatch = rest.match(/^policies\/categories\/custom\/([^/]+)$/)
    if (policyCustomCatMatch && vault) {
      const category = db.policyCategories.get(policyCustomCatMatch[1])
      if (!category || category.vaultId !== vaultId) {
        notFound(res, 'Category not found')
        return true
      }
      if (method === 'PATCH') {
        if (body.name != null) category.name = body.name
        if (body.description != null) category.description = body.description
        send(res, 200, {
          category,
          selectedCategoryIds: db.selectedPolicyCategories.get(vaultId) || [],
        })
        return true
      }
      if (method === 'DELETE') {
        db.policyCategories.delete(category.id)
        for (const [fieldId, field] of db.policyFields) {
          if (field.categoryTemplateId === category.id) db.policyFields.delete(fieldId)
        }
        const selected = (db.selectedPolicyCategories.get(vaultId) || []).filter(
          (cid) => cid !== category.id,
        )
        db.selectedPolicyCategories.set(vaultId, selected)
        send(res, 200, { selectedCategoryIds: selected })
        return true
      }
    }

    if (rest === 'policies/custom-fields' && vault && method === 'POST') {
      const field = {
        id: id(),
        vaultId,
        categoryTemplateId: body.categoryTemplateId,
        key: body.key || `field_${id().slice(0, 8)}`,
        label: body.label || 'Field',
        fieldType: body.fieldType || 'text',
        required: Boolean(body.required),
        displayOrder: body.displayOrder ?? 0,
        options: body.options,
        isActive: true,
        source: 'custom',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.policyFields.set(field.id, field)
      send(res, 200, field)
      return true
    }

    const policyFieldMatch = rest.match(/^policies\/fields\/([^/]+)$/)
    if (policyFieldMatch && vault && method === 'PATCH') {
      const field = db.policyFields.get(policyFieldMatch[1])
      if (!field || field.vaultId !== vaultId) {
        notFound(res, 'Field not found')
        return true
      }
      if (body.label != null) field.label = body.label
      field.updatedAt = nowIso()
      send(res, 200, field)
      return true
    }

    const policyCustomFieldDel = rest.match(/^policies\/custom-fields\/([^/]+)$/)
    if (policyCustomFieldDel && vault && method === 'DELETE') {
      const field = db.policyFields.get(policyCustomFieldDel[1])
      if (field && field.vaultId === vaultId) db.policyFields.delete(field.id)
      sendNoContent(res)
      return true
    }

    if (rest === 'policies/attachments' && vault && method === 'GET') {
      const policies = ensureSection(vaultId, 'policies', 'Policies')
      send(res, 200, {
        vaultId,
        sectionId: policies.id,
        attachments: [...db.policyAttachments.values()].filter((a) => a.vaultId === vaultId),
      })
      return true
    }

    if (rest === 'policies/attachments/init-upload' && vault && method === 'POST') {
      const policies = ensureSection(vaultId, 'policies', 'Policies')
      const attachment = {
        id: id(),
        vaultId,
        sectionId: policies.id,
        categoryTemplateId: body.categoryTemplateId,
        rowId: body.rowId,
        fieldKey: body.fieldKey,
        encryptedName: body.encryptedName,
        nameIv: body.nameIv,
        mimeType: body.mimeType || null,
        originalSizeBytes: body.originalSizeBytes || 0,
        encryptedSizeBytes: null,
        fileIv: null,
        isUploaded: false,
        uploadedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.policyAttachments.set(attachment.id, attachment)
      send(res, 200, { attachment, uploadUrl: mockUploadUrl(attachment.id) })
      return true
    }

    const policyAttMatch = rest.match(/^policies\/attachments\/([^/]+)(?:\/(.*))?$/)
    if (policyAttMatch && vault) {
      const attachment = db.policyAttachments.get(policyAttMatch[1])
      if (!attachment || attachment.vaultId !== vaultId) {
        notFound(res, 'Attachment not found')
        return true
      }
      const attRest = policyAttMatch[2] || ''
      if (attRest === 'complete' && method === 'POST') {
        attachment.fileIv = body.fileIv
        attachment.encryptedSizeBytes = body.encryptedSizeBytes
        attachment.isUploaded = true
        attachment.uploadedAt = nowIso()
        attachment.updatedAt = nowIso()
        send(res, 200, attachment)
        return true
      }
      if (attRest === 'download-url' && method === 'GET') {
        send(res, 200, { attachment, downloadUrl: mockUploadUrl(attachment.id) })
        return true
      }
      if (!attRest && method === 'DELETE') {
        db.policyAttachments.delete(attachment.id)
        db.blobs.delete(attachment.id)
        sendNoContent(res)
        return true
      }
    }

    if (rest === 'access' && vault) {
      if (method === 'GET') {
        send(res, 200, {
          access: [...db.vaultAccess.values()].filter((row) => row.vaultId === vaultId),
        })
        return true
      }
      if (method === 'POST') {
        const row = {
          id: id(),
          vaultId,
          userId: body.userId,
          wrappedDek: body.wrappedDek,
          role: body.role,
          accessLevel: body.accessLevel || 'read_only',
          expiresAt: body.expiresAt,
          grantedBy: user.id,
          grantedAt: nowIso(),
          isActive: true,
        }
        db.vaultAccess.set(row.id, row)
        send(res, 200, row)
        return true
      }
    }

    if (rest === 'access/rotate-wrapped-deks' && vault && method === 'POST') {
      const items = Array.isArray(body.items) ? body.items : []
      let vaultAccessUpdated = 0
      for (const item of items) {
        for (const row of db.vaultAccess.values()) {
          if (row.vaultId === vaultId && row.userId === item.userId) {
            row.wrappedDek = item.wrappedDek
            vaultAccessUpdated += 1
          }
        }
      }
      send(res, 200, { vaultAccessUpdated, sectionAccessUpdated: 0 })
      return true
    }

    if (rest === 'access/rewrap-self' && vault && method === 'POST') {
      for (const row of db.vaultAccess.values()) {
        if (row.vaultId === vaultId && row.userId === user.id) {
          row.wrappedDek = body.wrappedDek
        }
      }
      send(res, 200, { status: 'ok' })
      return true
    }
  }

  if (method === 'GET' && path === '/api/v1/trusted-circle') {
    send(res, 200, {
      members: [...db.circleMembers.values()].filter((m) => m.ownerId === user.id),
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/memberships') {
    send(res, 200, {
      memberships: [...db.circleMembers.values()].filter((m) => m.memberId === user.id),
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/trusted-circle/pending-access') {
    send(res, 200, { members: [] })
    return true
  }
  const circleMember = path.match(/^\/api\/v1\/trusted-circle\/([^/]+)$/)
  if (circleMember) {
    const member = db.circleMembers.get(circleMember[1])
    if (!member || member.ownerId !== user.id) {
      notFound(res, 'Member not found')
      return true
    }
    if (method === 'GET') {
      send(res, 200, member)
      return true
    }
    if (method === 'PUT') {
      Object.assign(member, body)
      send(res, 200, member)
      return true
    }
    if (method === 'DELETE') {
      db.circleMembers.delete(member.id)
      sendNoContent(res)
      return true
    }
  }

  const sectionAccess = path.match(/^\/api\/v1\/sections\/([^/]+)\/access$/)
  if (sectionAccess && method === 'GET') {
    send(res, 200, { access: [] })
    return true
  }

  if (method === 'POST' && path === '/api/v1/invitations') {
    const invitation = {
      id: id(),
      inviterId: user.id,
      inviteeEmail: body.inviteeEmail,
      inviteeName: body.inviteeName,
      relationship: body.relationship,
      phone: body.phone,
      role: body.role || 'key_person',
      advisorType: body.advisorType,
      accessDurationDays: body.accessDurationDays,
      accessTiming: body.accessTiming || 'in_end',
      token: id(),
      message: body.message,
      status: 'pending',
      expiresAt: new Date(Date.now() + (body.expiresInDays || 7) * 86400000).toISOString(),
      createdAt: nowIso(),
      allowedSectionTypes: body.allowedSectionTypes || [],
      inviter: { id: user.id, email: user.email, name: user.name },
    }
    db.invitations.set(invitation.id, invitation)
    send(res, 200, invitation)
    return true
  }
  if (method === 'GET' && path === '/api/v1/invitations/sent') {
    send(res, 200, {
      invitations: [...db.invitations.values()].filter((i) => i.inviterId === user.id),
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/invitations/received') {
    send(res, 200, {
      invitations: [...db.invitations.values()].filter(
        (i) => i.inviteeEmail.toLowerCase() === user.email.toLowerCase(),
      ),
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/invitations/pending-release') {
    send(res, 200, {
      invitations: [...db.invitations.values()].filter(
        (i) => i.inviterId === user.id && i.status === 'pending_release',
      ),
    })
    return true
  }
  if (method === 'POST' && path === '/api/v1/invitations/release') {
    let released = 0
    for (const invitation of db.invitations.values()) {
      if (invitation.inviterId === user.id && invitation.status === 'pending_release') {
        invitation.status = 'pending'
        released += 1
      }
    }
    send(res, 200, { message: 'Released (mock)', released })
    return true
  }
  const inviteToken = path.match(/^\/api\/v1\/invitations\/token\/([^/]+)$/)
  if (inviteToken && method === 'GET') {
    const invitation = [...db.invitations.values()].find((i) => i.token === inviteToken[1])
    if (!invitation) {
      notFound(res, 'Invitation not found')
      return true
    }
    send(res, 200, invitation)
    return true
  }
  const inviteAction = path.match(/^\/api\/v1\/invitations\/([^/]+)(?:\/(accept|decline|release))?$/)
  if (inviteAction) {
    const invitation = db.invitations.get(inviteAction[1])
    if (!invitation) {
      notFound(res, 'Invitation not found')
      return true
    }
    const action = inviteAction[2]
    if (!action && method === 'DELETE') {
      invitation.status = 'cancelled'
      db.invitations.delete(invitation.id)
      sendNoContent(res)
      return true
    }
    if (action === 'accept' && method === 'POST') {
      invitation.status = 'accepted'
      invitation.acceptedAt = nowIso()
      send(res, 200, { message: 'Accepted (mock)' })
      return true
    }
    if (action === 'decline' && method === 'POST') {
      invitation.status = 'cancelled'
      send(res, 200, { message: 'Declined (mock)' })
      return true
    }
    if (action === 'release' && method === 'POST') {
      invitation.status = 'pending'
      send(res, 200, invitation)
      return true
    }
  }

  if (method === 'GET' && path === '/api/v1/activity') {
    const limit = Number(url.searchParams.get('limit') || 10)
    const offset = Number(url.searchParams.get('offset') || 0)
    send(res, 200, { activity: [], hasMore: false, limit, offset })
    return true
  }

  if (method === 'GET' && path === '/api/v1/release/public-key') {
    send(res, 200, {
      publicKeyB64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      keyId: 'mock-release-key',
      algorithm: 'x25519',
    })
    return true
  }
  if (method === 'GET' && path === '/api/v1/release/pending-claims') {
    send(res, 200, { claims: [] })
    return true
  }
  if (method === 'GET' && path === '/api/v1/release/recovery/status') {
    send(res, 200, { required: false })
    return true
  }
  if (method === 'POST' && path === '/api/v1/release/recovery/decision') {
    send(res, 200, { required: false, decision: body.decision || 'restore_endplan' })
    return true
  }
  const releaseVault = path.match(/^\/api\/v1\/release\/vaults\/([^/]+)\/release\/([^/]+)$/)
  if (releaseVault && method === 'POST') {
    send(res, 200, {
      id: id(),
      vaultId: releaseVault[1],
      userId: releaseVault[2],
      role: 'recipient',
      accessLevel: body.accessLevel || 'read_only',
      expiresAt: body.expiresAt,
      grantedAt: nowIso(),
      isActive: true,
    })
    return true
  }
  const claimMatch = path.match(/^\/api\/v1\/release\/claim\/([^/]+)$/)
  if (claimMatch && method === 'POST') {
    send(res, 200, {
      membershipId: claimMatch[1],
      vaultId: id(),
      claimRequestedAt: nowIso(),
      alreadyRequested: false,
      owner: { id: user.id, email: user.email, name: user.name },
    })
    return true
  }

  send(res, 501, {
    message: `Mock has no handler for ${method} ${path}`,
    code: 'not_implemented',
  })
  return true
}

function listen(port, label) {
  const server = createServer((req, res) => {
    handle(req, res)
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`${label} http://127.0.0.1:${port}`)
  })
  return server
}

const apiServer = listen(API_PORT, 'Mock API+auth')
let authServer = null
if (AUTH_PORT !== API_PORT) {
  authServer = listen(AUTH_PORT, 'Mock auth alias')
}

console.log(`
EndPlan mock backend (not the private API)

  Demo login:  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}
  CORS:        ${CORS_ORIGIN}

Use the SAME origin for both Vite env vars so the session cookie is sent:

  VITE_AUTH_URL=http://localhost:${API_PORT}
  VITE_API_URL=http://localhost:${API_PORT}

Then: npm run dev
`)

function shutdown() {
  apiServer.close()
  authServer?.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
