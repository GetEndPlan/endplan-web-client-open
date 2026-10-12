import type { KeyAlgorithm, WrappedDekEntry } from '../types'

export type AlgorithmKeyPair<TAlgorithm extends KeyAlgorithm = KeyAlgorithm> = {
  publicKeyB64: string
  privateKeyB64: string
  algorithm: TAlgorithm
}

export interface KeyWrappingAlgorithm<
  TAlgorithm extends KeyAlgorithm,
  TWrappedDekEntry extends WrappedDekEntry,
> {
  readonly algorithm: TAlgorithm
  isEnabled(): boolean
  isSupported(): Promise<boolean>
  generateKeyPair(): Promise<AlgorithmKeyPair<TAlgorithm>>
  wrapDek(dek: Uint8Array, recipientPublicKeyB64: string): Promise<TWrappedDekEntry>
  unwrapDek(entry: TWrappedDekEntry, privateKeyB64: string): Promise<Uint8Array>
}
