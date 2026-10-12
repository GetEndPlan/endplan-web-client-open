import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildContactsCsv } from '../contacts-csv.ts'
import type { ContactItem } from '../../../model/contacts.ts'

const contact: ContactItem = {
  id: 'c1',
  fullName: 'Jane Doe',
  role: 'lawyer',
  customRoleLabel: '',
  phone: '555-0100',
  email: 'jane@example.com',
  notes: 'Family attorney',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('buildContactsCsv', () => {
  it('writes contact fields and localized role labels', () => {
    const csv = buildContactsCsv({
      items: [contact],
      headers: {
        fullName: 'Name',
        role: 'Role',
        phone: 'Phone',
        email: 'Email',
        notes: 'Notes',
      },
      roleLabels: {
        lawyer: 'Lawyer',
        doctor: 'Doctor',
        financial_manager: 'Financial manager',
        power_of_attorney: 'Power of attorney',
        other: 'Other',
      },
    })

    assert.match(csv, /Name,Role,Phone,Email,Notes/)
    assert.match(csv, /Jane Doe,Lawyer,555-0100,jane@example.com,Family attorney/)
  })
})
