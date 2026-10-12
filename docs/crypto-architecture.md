# EndPlan Client-Side Encryption Architecture

This document describes the **zero-knowledge encryption system** implemented in `src/shared/lib/crypto.ts`. The architecture ensures that the server never has access to plaintext user data or encryption keys derived from passwords.

---

## Overview

EndPlan uses a **layered key hierarchy** with client-side encryption:

```
User Password
     │
     ▼ (Argon2id KDF)
    KEK (Key Encryption Key)
     │
     ├──► Encrypts user's private key (AES-256-GCM)
     │
     ▼
    DEK (Data Encryption Key) ── random 32 bytes
     │
     ├──► Wrapped per-recipient (X25519 sealed box)
     ├──► Wrapped for release service (RSA-OAEP)
     │
     ▼ (HKDF-SHA256)
Purpose-Specific Keys
     │
     ├──► vault-encryption key
     └──► section-encryption key
          │
          ▼ (AES-256-GCM + AAD)
     Encrypted Data
```

---

## Key Types

| Key | Purpose | Generation | Storage |
|-----|---------|------------|---------|
| **KEK** | Encrypts/decrypts user's private key | Derived from password via Argon2id | Never stored; re-derived on login |
| **DEK** | Encrypts vault and section content | Random 32 bytes (`generateDek()`) | Encrypted, stored server-side per vault |
| **User Key Pair** | Allows others to share DEKs with user | X25519 via libsodium | Public: server; Private: encrypted by KEK |
| **Purpose Keys** | Scoped encryption (vault vs section) | Derived from DEK via HKDF | Never stored; derived on-demand |

---

## Algorithms

### Password-Based Key Derivation (KEK)

**Algorithm**: Argon2id (via `hash-wasm`)

```typescript
const DEFAULT_KDF_PARAMS = {
  iterations: 4,           // OWASP recommends 2-3 minimum
  memorySize: 64 * 1024,   // 64 MiB (OWASP recommended)
  parallelism: 4,          // Multi-core for better security
  hashLength: 32,          // 256-bit output
}
```

**Usage**:

```typescript
import { deriveKek } from '@/shared/lib/crypto'

// First time (generates salt)
const { kek, params } = await deriveKek(password)
// Store params.saltB64 server-side for future logins

// Re-derive on login (use stored salt)
const { kek } = await deriveKek(password, { saltB64: storedSalt })
```

**Why Argon2id**: Memory-hard function resistant to GPU/ASIC attacks, recommended by OWASP for password hashing.

---

### Purpose-Specific Key Derivation (HKDF)

**Algorithm**: HKDF-SHA256 (WebCrypto)

```typescript
import { hkdfSha256 } from '@/shared/lib/crypto'

// Derive a vault-specific encryption key from DEK
const vaultKey = await hkdfSha256(dek, 'vault-encryption')

// Derive a section-specific encryption key from DEK
const sectionKey = await hkdfSha256(dek, 'section-encryption')
```

**Why HKDF**: Cryptographically separates keys for different purposes. Even if one derived key is compromised, others remain secure.

---

### Symmetric Encryption (Data)

**Algorithm**: AES-256-GCM (WebCrypto)

| Parameter | Value |
|-----------|-------|
| Key size | 256 bits (32 bytes) |
| IV size | 96 bits (12 bytes), random per encryption |
| Auth tag | 128 bits (included in ciphertext) |

**Envelope Format** (`CryptoEnvelopeV1`):

```typescript
type CryptoEnvelopeV1 = {
  v: 1                    // Version for future algorithm upgrades
  alg: 'AES-256-GCM'      // Algorithm identifier
  ciphertextB64: string   // Base64-encoded ciphertext + auth tag
  ivB64: string           // Base64-encoded IV
}
```

---

### Associated Authenticated Data (AAD)

AAD binds ciphertext to its context, preventing **ciphertext swapping attacks** (e.g., moving one user's vault to another user).

**Vault AAD format**:
```
vault:<vaultId>|owner:<ownerId>|type:will|v:1
```

**Section AAD format**:
```
section:<sectionType>|vault:<vaultId>|owner:<ownerId>|v:1
```

If an attacker tries to associate ciphertext with a different vault or owner, decryption fails because the AAD won't match.

---

### Asymmetric Encryption (Key Wrapping)

#### X25519 Sealed Box (User-to-User)

**Algorithm**: libsodium `crypto_box_seal`

Used to share DEKs with other users (e.g., trusted circle members):

```typescript
import { wrapDekForPublicKey, unwrapDekWithKeyPair } from '@/shared/lib/crypto'

// Sender wraps DEK for recipient's public key
const wrappedDekB64 = await wrapDekForPublicKey(dek, recipientPublicKeyB64)

// Recipient unwraps DEK with their key pair
const dek = await unwrapDekWithKeyPair(wrappedDekB64, publicKeyB64, privateKeyB64)
```

#### RSA-OAEP (Release Service)

**Algorithm**: RSA-OAEP with SHA-256 (WebCrypto)

Used when the release service provides an RSA public key (e.g., from AWS KMS):

```typescript
import { wrapDekForRsaPublicKey } from '@/shared/lib/crypto'

// Wrap DEK for the release service's RSA public key
const wrappedDekB64 = await wrapDekForRsaPublicKey(dek, rsaPublicKeySpkiB64)
```

---

## API Reference

### Key Generation & Derivation

| Function | Description |
|----------|-------------|
| `generateDek()` | Generate a random 32-byte DEK |
| `deriveKek(password, options?)` | Derive KEK from password using Argon2id |
| `generateUserKeyPair()` | Generate X25519 key pair for the user |
| `hkdfSha256(ikm, info, length?)` | Derive purpose-specific key via HKDF |

### Private Key Encryption

| Function | Description |
|----------|-------------|
| `encryptPrivateKey(privateKeyB64, kek)` | Encrypt user's private key with KEK |
| `decryptPrivateKey(payload, kek)` | Decrypt user's private key with KEK |

### DEK Wrapping (Sharing)

| Function | Description |
|----------|-------------|
| `wrapDekForPublicKey(dek, publicKeyB64)` | Wrap DEK using X25519 sealed box |
| `wrapDekForRsaPublicKey(dek, rsaPublicKeySpkiB64)` | Wrap DEK using RSA-OAEP |
| `unwrapDekWithKeyPair(wrappedB64, pubB64, privB64)` | Unwrap DEK with X25519 key pair |

### Vault Encryption

| Function | Description |
|----------|-------------|
| `encryptVaultJson(data, dek, vaultId, ownerId)` | Encrypt vault data with AAD binding |
| `decryptVaultJson(payload, dek, vaultId, ownerId)` | Decrypt vault data with AAD verification |

### Section Encryption

| Function | Description |
|----------|-------------|
| `encryptSectionContent(data, dek, vaultId, ownerId, sectionType)` | Encrypt section content |
| `decryptSectionContent(encryptedData, encryptionIv, dek, vaultId, ownerId, sectionType)` | Decrypt section content |

### Utilities

| Function | Description |
|----------|-------------|
| `cryptoEncoding.toBase64(bytes)` | Convert Uint8Array to Base64 string |
| `cryptoEncoding.fromBase64(b64)` | Convert Base64 string to Uint8Array |
| `kdfDefaults` | Default KDF parameters (iterations, memory, etc.) |

---

## Usage Examples

### User Registration Flow

```typescript
import {
  generateDek,
  deriveKek,
  generateUserKeyPair,
  encryptPrivateKey,
} from '@/shared/lib/crypto'

// 1. Derive KEK from user's password
const { kek, params } = await deriveKek(password)

// 2. Generate user's asymmetric key pair
const { publicKeyB64, privateKeyB64 } = await generateUserKeyPair()

// 3. Encrypt private key with KEK
const encryptedPrivateKey = await encryptPrivateKey(privateKeyB64, kek)

// 4. Send to server:
//    - params (salt, iterations, etc.) for future KEK derivation
//    - publicKeyB64 (stored plaintext for others to share with this user)
//    - encryptedPrivateKey (server stores, but cannot decrypt)
```

### Creating a Vault

```typescript
import { generateDek, encryptVaultJson, wrapDekForPublicKey } from '@/shared/lib/crypto'

// 1. Generate a new DEK for this vault
const dek = generateDek()

// 2. Encrypt vault content
const encrypted = await encryptVaultJson(
  { title: 'My Will', content: '...' },
  dek,
  vaultId,
  ownerId,
)

// 3. Wrap DEK for the owner's public key (so they can decrypt later)
const wrappedDek = await wrapDekForPublicKey(dek, ownerPublicKeyB64)

// 4. Send to server: encrypted payload + wrappedDek
```

### Sharing Vault Access

```typescript
import { unwrapDekWithKeyPair, wrapDekForPublicKey } from '@/shared/lib/crypto'

// 1. Owner unwraps their copy of the DEK
const dek = await unwrapDekWithKeyPair(
  myWrappedDekB64,
  myPublicKeyB64,
  myPrivateKeyB64,
)

// 2. Re-wrap DEK for the recipient's public key
const recipientWrappedDek = await wrapDekForPublicKey(dek, recipientPublicKeyB64)

// 3. Server stores recipientWrappedDek; recipient can now decrypt the vault
```

### Encrypting Section Content

```typescript
import { encryptSectionContent, decryptSectionContent } from '@/shared/lib/crypto'

// Encrypt
const { encryptedData, encryptionIv } = await encryptSectionContent(
  { beneficiaries: [...], assets: [...] },
  dek,
  vaultId,
  ownerId,
  'beneficiaries',
)

// Decrypt
const content = await decryptSectionContent(
  encryptedData,
  encryptionIv,
  dek,
  vaultId,
  ownerId,
  'beneficiaries',
)
```

---

## Security Properties

| Property | How It's Achieved |
|----------|-------------------|
| **Zero-knowledge** | Server never receives passwords, KEKs, or plaintext DEKs |
| **Forward secrecy** | Each vault has its own random DEK |
| **Key separation** | HKDF derives distinct keys for vault vs section encryption |
| **Integrity** | AES-GCM provides authenticated encryption |
| **Context binding** | AAD prevents ciphertext swapping between vaults/users |
| **Password brute-force resistance** | Argon2id with 64 MiB memory cost |
| **Versioning** | `CryptoEnvelopeV1` allows future algorithm upgrades |

---

## Environment Compatibility

The library works in:
- **Browser** (WebCrypto + native `btoa`/`atob`)
- **Node.js** (WebCrypto + `Buffer`)
- **React Native** (WebCrypto + libsodium fallbacks)

Base64 encoding automatically uses the best available method for the environment.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `libsodium-wrappers-sumo` | X25519 key pairs and sealed boxes |
| `hash-wasm` | Argon2id password hashing |
| WebCrypto (built-in) | AES-GCM, HKDF, RSA-OAEP |

---

## Summary

The EndPlan crypto module implements a defense-in-depth encryption strategy:

1. **Argon2id** protects against password brute-forcing
2. **HKDF** ensures key separation between encryption contexts
3. **AES-256-GCM with AAD** provides authenticated encryption bound to vault/user context
4. **X25519/RSA-OAEP** enable secure key sharing without exposing DEKs
5. **Versioned envelopes** allow future cryptographic agility

This architecture ensures that even if the server is compromised, user data remains encrypted and inaccessible without the user's password.
