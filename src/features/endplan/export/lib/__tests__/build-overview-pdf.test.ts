import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildEndplanOverviewPdf, toPdfWinAnsi } from '../build-overview-pdf.ts'
import type { EndplanOverviewModel } from '../../model/overview-document.ts'

const copy = {
  title: 'EndPlan overview',
  preparedFor: 'Prepared for Pat',
  generatedAt: 'Generated 27 August 2026',
  purpose: 'This is a briefing.',
  howToUseTitle: 'How to use this file',
  howToUseBody: 'Read this PDF first.',
  countsLine: '1 contacts · 0 instructions · 0 assets · 0 documents',
  startHereTitle: 'Start here',
  startHereEmpty: 'No priority contacts yet.',
  peopleTitle: 'People',
  peopleEmpty: 'No contacts saved.',
  instructionsTitle: 'Instructions',
  instructionsEmpty: 'No instructions saved.',
  assetsTitle: 'Assets',
  assetsEmpty: 'No assets saved.',
  assetsHint: 'Full details are in the Assets folder.',
  documentsTitle: 'Documents',
  documentsEmpty: 'No documents saved.',
  documentsHint: 'The files themselves are in the Documents folder.',
  footer: 'EndPlan overview · keep confidential',
  phoneLabel: 'Phone',
  emailLabel: 'Email',
  notesLabel: 'Notes',
  institutionLabel: 'Institution',
  relatedLabel: 'Related',
}

const emptyModel: EndplanOverviewModel = {
  ownerName: 'Pat',
  generatedAtLabel: '27 August 2026',
  startHereContacts: [],
  contacts: [],
  instructions: [],
  assets: [],
  documents: [],
}

describe('overview PDF', () => {
  it('maps fancy punctuation into WinAnsi-safe characters', () => {
    assert.equal(toPdfWinAnsi('“My EndPlan” — café'), '"My EndPlan" - café')
  })

  it('produces a PDF document', async () => {
    const bytes = await buildEndplanOverviewPdf(emptyModel, copy)
    assert.equal(String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0), '%PDF')
  })
})
