import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AssetSchemaCategory } from '../../../api/clients/vault-api.ts'
import { serializeContactLinkRef } from '../../../model/asset-contact-ref.ts'
import { serializeDocumentLinkRef } from '../../../model/asset-attachment-ref.ts'
import { buildAssetCsvFiles } from '../assets-csv.ts'

const bankCategory: AssetSchemaCategory = {
  id: 'cat-bank',
  key: 'bank_accounts',
  name: 'Bank accounts',
  displayOrder: 1,
  isActive: true,
  fields: [
    { id: 'f1', key: 'asset_name', label: 'Name', fieldType: 'text', required: false, displayOrder: 1, source: 'template' },
    { id: 'f2', key: 'advisor', label: 'Advisor', fieldType: 'contact', required: false, displayOrder: 2, source: 'template' },
    { id: 'f3', key: 'statement', label: 'Statement', fieldType: 'attachment', required: false, displayOrder: 3, source: 'template' },
  ],
}

describe('buildAssetCsvFiles', () => {
  it('skips empty placeholder rows and resolves contact and attachment cells', () => {
    const files = buildAssetCsvFiles({
      payload: {
        schemaVersion: 2,
        categories: [
          {
            categoryTemplateId: 'cat-bank',
            categoryName: 'Bank accounts',
            rows: [
              { id: 'empty', values: { asset_name: '' } },
              {
                id: 'row-1',
                values: {
                  asset_name: 'Checking',
                  advisor: serializeContactLinkRef({ contactId: 'c1', displayName: 'Old' }),
                  statement: serializeDocumentLinkRef({ fileId: 'doc-1', fileName: 'statement.pdf' }),
                },
              },
            ],
          },
        ],
      },
      categories: [bankCategory],
      assetsFolderName: 'Assets',
      untitledCategoryName: 'Category',
      contactsById: {
        c1: { id: 'c1', label: 'Jane Doe', subtitle: 'Lawyer' },
      },
      attachmentNamesById: {},
      documentNamesById: { 'doc-1': 'statement.pdf' },
    })

    assert.equal(files.length, 1)
    assert.equal(files[0]?.relativePath, 'Assets/Bank accounts.csv')
    assert.match(files[0]?.csv ?? '', /Checking/)
    assert.match(files[0]?.csv ?? '', /Jane Doe/)
    assert.match(files[0]?.csv ?? '', /statement.pdf/)
    assert.doesNotMatch(files[0]?.csv ?? '', /empty/)
  })
})
