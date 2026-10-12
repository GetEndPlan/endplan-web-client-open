import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getSharedVaultRoleDescription,
  getSharedVaultRoleLabel,
} from '../shared-vault-role.ts'

test('getSharedVaultRoleLabel maps known roles', () => {
  assert.equal(getSharedVaultRoleLabel('key_person'), 'Key Person')
  assert.equal(getSharedVaultRoleLabel('recipient'), 'Recipient')
  assert.equal(getSharedVaultRoleLabel('advisor'), 'Advisor')
})

test('getSharedVaultRoleLabel falls back to raw role when unknown', () => {
  assert.equal(getSharedVaultRoleLabel('trustee'), 'trustee')
})

test('getSharedVaultRoleDescription maps known roles', () => {
  assert.equal(
    getSharedVaultRoleDescription('key_person'),
    'You have full access to this EndPlan as a Key Person.',
  )
  assert.equal(
    getSharedVaultRoleDescription('recipient'),
    'You have access to specific sections of this EndPlan.',
  )
})

test('getSharedVaultRoleDescription falls back for unknown roles', () => {
  assert.equal(
    getSharedVaultRoleDescription('custom_role'),
    'You have been granted access to this EndPlan.',
  )
})
