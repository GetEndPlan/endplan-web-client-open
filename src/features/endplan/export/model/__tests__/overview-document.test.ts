import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AssetSchemaCategory } from '../../../api/clients/vault-api.ts'
import { serializeContactLinkRef } from '../../../model/asset-contact-ref.ts'
import { buildEndplanOverviewModel } from '../overview-document.ts'
import type { ContactItem } from '../../../model/contacts.ts'

const copy = {
  untitledInstruction: 'Untitled instruction',
  untitledAsset: 'Untitled asset',
  untitledContact: 'Untitled contact',
  untitledDocument: 'Untitled file',
  untitledCategory: 'Category',
  writtenNoteType: 'Written note',
  stepByStepType: 'Step-by-step',
  relatedContact: 'Contact',
  relatedDocument: 'Document',
  relatedAssets: 'Assets',
}

const roleLabels = {
  lawyer: 'Lawyer',
  doctor: 'Doctor',
  financial_manager: 'Financial manager',
  power_of_attorney: 'Power of attorney',
  other: 'Other',
}

const lawyer: ContactItem = {
  id: 'c-law',
  fullName: 'Jane Lawyer',
  role: 'lawyer',
  customRoleLabel: '',
  phone: '555-0100',
  email: 'jane@example.com',
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const other: ContactItem = {
  id: 'c-other',
  fullName: 'Sam Neighbor',
  role: 'other',
  customRoleLabel: 'Neighbor',
  phone: '',
  email: '',
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const poa: ContactItem = {
  id: 'c-poa',
  fullName: 'Alex POA',
  role: 'power_of_attorney',
  customRoleLabel: '',
  phone: '555-0199',
  email: '',
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const categories: AssetSchemaCategory[] = [
  {
    id: 'cat-bank',
    key: 'bank_accounts',
    name: 'Bank accounts',
    displayOrder: 1,
    isActive: true,
    fields: [
      { id: 'f1', key: 'asset_name', label: 'Name', fieldType: 'text', required: false, displayOrder: 1, source: 'template' },
      { id: 'f2', key: 'institution', label: 'Institution', fieldType: 'text', required: false, displayOrder: 2, source: 'template' },
      { id: 'f3', key: 'account_number', label: 'Account number', fieldType: 'text', required: false, displayOrder: 3, source: 'template' },
      { id: 'f4', key: 'portal_password', label: 'Password', fieldType: 'password', required: false, displayOrder: 4, source: 'template' },
      { id: 'f5', key: 'notes', label: 'Notes', fieldType: 'textarea', required: false, displayOrder: 5, source: 'template' },
      { id: 'f6', key: 'advisor', label: 'Advisor', fieldType: 'contact', required: false, displayOrder: 6, source: 'template' },
    ],
  },
]

describe('buildEndplanOverviewModel', () => {
  it('lists priority contacts first and omits passwords and account numbers from the asset briefing', () => {
    const model = buildEndplanOverviewModel({
      ownerName: 'Pat Owner',
      generatedAtLabel: '27 August 2026',
      contacts: [other, lawyer, poa],
      roleLabels,
      instructions: { schemaVersion: 1, items: [] },
      assetsPayload: {
        schemaVersion: 2,
        categories: [
          {
            categoryTemplateId: 'cat-bank',
            categoryName: 'Bank accounts',
            rows: [
              {
                id: 'row-1',
                values: {
                  asset_name: 'Checking',
                  institution: 'Chase',
                  account_number: '123456789',
                  portal_password: 'super-secret',
                  notes: 'Joint account',
                  advisor: serializeContactLinkRef({ contactId: 'c-law', displayName: 'Jane' }),
                },
              },
            ],
          },
        ],
      },
      assetCategories: categories,
      contactsById: {
        'c-law': { id: 'c-law', label: 'Jane Lawyer', subtitle: '' },
      },
      attachmentNamesById: {},
      documentNamesById: {},
      documentPathLabels: ['Taxes / w2.pdf'],
      copy,
    })

    assert.deepEqual(
      model.startHereContacts.map((item) => item.fullName),
      ['Alex POA', 'Jane Lawyer'],
    )
    assert.equal(model.assets.length, 1)
    assert.equal(model.assets[0]?.name, 'Checking')
    assert.equal(model.assets[0]?.institution, 'Chase')
    assert.equal(model.assets[0]?.notes, 'Joint account')
    assert.deepEqual(model.assets[0]?.relatedPeople, ['Jane Lawyer'])
    const serialized = JSON.stringify(model.assets)
    assert.equal(serialized.includes('123456789'), false)
    assert.equal(serialized.includes('super-secret'), false)
    assert.deepEqual(model.documents.map((item) => item.pathLabel), ['Taxes / w2.pdf'])
  })
})
