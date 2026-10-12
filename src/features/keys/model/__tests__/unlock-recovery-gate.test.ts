import test from 'node:test'
import assert from 'node:assert/strict'

import {
  FAILED_UNLOCKS_BEFORE_RECOVERY_MODAL,
  shouldAutoOpenUnlockRecoveryModal,
  shouldShowUnlockRecoveryHelp,
} from '../unlock-recovery-gate.ts'

test('shouldShowUnlockRecoveryHelp after the first failed unlock when a recovery wrap exists', () => {
  assert.equal(shouldShowUnlockRecoveryHelp(true, 0), false)
  assert.equal(shouldShowUnlockRecoveryHelp(true, 1), true)
  assert.equal(shouldShowUnlockRecoveryHelp(false, 3), false)
})

test('shouldAutoOpenUnlockRecoveryModal only after three failed password attempts', () => {
  assert.equal(FAILED_UNLOCKS_BEFORE_RECOVERY_MODAL, 3)
  assert.equal(shouldAutoOpenUnlockRecoveryModal(true, 1), false)
  assert.equal(shouldAutoOpenUnlockRecoveryModal(true, 2), false)
  assert.equal(shouldAutoOpenUnlockRecoveryModal(true, 3), true)
  assert.equal(shouldAutoOpenUnlockRecoveryModal(false, 3), false)
})
