import { generateMnemonic, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

/** 128-bit entropy → 12 English BIP39 words (checksum included). */
export function generateRecoveryMnemonic12(): string {
  return generateMnemonic(wordlist, 128)
}

/** Split a normalized mnemonic into 12 words for grid display. */
export function splitRecoveryMnemonicWords(mnemonic: string): string[] {
  return mnemonic.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * Normalizes user input (paste / typing) to a canonical BIP39 English mnemonic
 * (lowercase, single spaces). Throws if not exactly 12 valid words.
 */
export function normalizeRecoveryMnemonicInput(secret: string): string {
  const words = secret
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
  if (words.length !== 12) {
    throw new Error('RECOVERY_PHRASE_WORD_COUNT')
  }
  const phrase = words.join(' ')
  if (!validateMnemonic(phrase, wordlist)) {
    throw new Error('RECOVERY_PHRASE_INVALID')
  }
  return phrase
}
