import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  parseAssetContactCellValue,
  resolveAssetContactCellLabel,
  serializeContactLinkRef,
} from '../asset-contact-ref.ts'

describe('asset contact ref', () => {
  it('round-trips contact link serialization', () => {
    const raw = serializeContactLinkRef({
      contactId: 'contact-1',
      displayName: 'Jane Doe',
    })
    const parsed = parseAssetContactCellValue(raw)
    assert.equal(parsed.kind, 'contact_link')
    if (parsed.kind !== 'contact_link') return
    assert.equal(parsed.reference.contactId, 'contact-1')
    assert.equal(parsed.reference.displayName, 'Jane Doe')
  })

  it('resolves live contact label over stored display name', () => {
    const raw = serializeContactLinkRef({
      contactId: 'contact-1',
      displayName: 'Old Name',
    })
    const label = resolveAssetContactCellLabel(raw, {
      'contact-1': { id: 'contact-1', label: 'New Name', subtitle: 'Lawyer' },
    })
    assert.equal(label, 'New Name')
  })

  it('falls back to display name when contact is missing', () => {
    const raw = serializeContactLinkRef({
      contactId: 'missing',
      displayName: 'Archived Contact',
    })
    const label = resolveAssetContactCellLabel(raw, {})
    assert.equal(label, 'Archived Contact')
  })
})
