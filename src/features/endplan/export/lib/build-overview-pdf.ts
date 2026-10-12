import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { EndplanOverviewModel } from '../model/overview-document'

export type EndplanOverviewPdfCopy = {
  title: string
  preparedFor: string
  generatedAt: string
  purpose: string
  howToUseTitle: string
  howToUseBody: string
  countsLine: string
  startHereTitle: string
  startHereEmpty: string
  peopleTitle: string
  peopleEmpty: string
  instructionsTitle: string
  instructionsEmpty: string
  assetsTitle: string
  assetsEmpty: string
  assetsHint: string
  documentsTitle: string
  documentsEmpty: string
  documentsHint: string
  footer: string
  phoneLabel: string
  emailLabel: string
  notesLabel: string
  institutionLabel: string
  relatedLabel: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 54
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LINE_GAP = 3
const SECTION_GAP = 14
const INK = rgb(0.12, 0.16, 0.22)
const MUTED = rgb(0.38, 0.42, 0.48)
const RULE = rgb(0.82, 0.85, 0.88)

const WIN_ANSI_REPLACEMENTS: Record<string, string> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2026': '...',
  '\u00A0': ' ',
}

export function toPdfWinAnsi(text: string): string {
  let out = ''
  for (const char of text) {
    const replacement = WIN_ANSI_REPLACEMENTS[char]
    if (replacement) {
      out += replacement
      continue
    }
    const code = char.codePointAt(0) ?? 0
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
      out += char
    } else {
      out += '?'
    }
  }
  return out
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = toPdfWinAnsi(text)
  const paragraphs = safe.split(/\r?\n/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next
        continue
      }
      if (current) lines.push(current)
      current = word
      while (current.length > 1 && font.widthOfTextAtSize(current, size) > maxWidth) {
        let cut = current.length - 1
        while (cut > 1 && font.widthOfTextAtSize(current.slice(0, cut), size) > maxWidth) {
          cut -= 1
        }
        lines.push(current.slice(0, cut))
        current = current.slice(cut)
      }
    }
    if (current) lines.push(current)
  }

  return lines
}

class OverviewPdfWriter {
  private readonly doc: PDFDocument
  private readonly font: PDFFont
  private readonly fontBold: PDFFont
  private readonly footerLabel: string
  private page: PDFPage
  private y: number
  private pageIndex = 1

  constructor(doc: PDFDocument, font: PDFFont, fontBold: PDFFont, footerLabel: string) {
    this.doc = doc
    this.font = font
    this.fontBold = fontBold
    this.footerLabel = footerLabel
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.y = PAGE_HEIGHT - MARGIN
  }

  private addPage(): void {
    this.drawFooter()
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pageIndex += 1
    this.y = PAGE_HEIGHT - MARGIN
  }

  private ensureSpace(height: number): void {
    if (this.y - height < MARGIN + 28) {
      this.addPage()
    }
  }

  private drawFooter(): void {
    this.page.drawLine({
      start: { x: MARGIN, y: MARGIN - 10 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN - 10 },
      thickness: 0.5,
      color: RULE,
    })
    this.page.drawText(toPdfWinAnsi(`${this.footerLabel}  ·  ${this.pageIndex}`), {
      x: MARGIN,
      y: MARGIN - 24,
      size: 8,
      font: this.font,
      color: MUTED,
    })
  }

  heading(text: string): void {
    const size = 13
    this.ensureSpace(size + 16)
    this.y -= 4
    this.page.drawText(toPdfWinAnsi(text), {
      x: MARGIN,
      y: this.y - size,
      size,
      font: this.fontBold,
      color: INK,
    })
    this.y -= size + 6
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.8,
      color: RULE,
    })
    this.y -= SECTION_GAP / 2
  }

  title(text: string): void {
    const size = 22
    this.ensureSpace(size + 8)
    this.page.drawText(toPdfWinAnsi(text), {
      x: MARGIN,
      y: this.y - size,
      size,
      font: this.fontBold,
      color: INK,
    })
    this.y -= size + 10
  }

  paragraph(text: string, options?: { muted?: boolean; bold?: boolean; size?: number }): void {
    const size = options?.size ?? 10
    const font = options?.bold ? this.fontBold : this.font
    const color = options?.muted ? MUTED : INK
    const lines = wrapText(text, font, size, CONTENT_WIDTH)
    for (const line of lines) {
      this.ensureSpace(size + LINE_GAP)
      if (line) {
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y - size,
          size,
          font,
          color,
        })
      }
      this.y -= size + LINE_GAP
    }
  }

  spacer(amount = 8): void {
    this.y -= amount
  }

  finish(): void {
    this.drawFooter()
  }
}

function contactBlock(contact: EndplanOverviewModel['contacts'][number], copy: EndplanOverviewPdfCopy): string[] {
  const lines = [contact.fullName]
  if (contact.roleLabel) lines.push(contact.roleLabel)
  if (contact.phone) lines.push(`${copy.phoneLabel}: ${contact.phone}`)
  if (contact.email) lines.push(`${copy.emailLabel}: ${contact.email}`)
  if (contact.notes) lines.push(`${copy.notesLabel}: ${contact.notes}`)
  return lines
}

export async function buildEndplanOverviewPdf(
  model: EndplanOverviewModel,
  copy: EndplanOverviewPdfCopy,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(copy.title)
  doc.setProducer('EndPlan')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const writer = new OverviewPdfWriter(doc, font, fontBold, copy.footer)

  writer.title(copy.title)
  if (model.ownerName && copy.preparedFor) {
    writer.paragraph(copy.preparedFor, { bold: true, size: 11 })
  }
  writer.paragraph(copy.generatedAt, { muted: true, size: 9 })
  writer.spacer(6)
  writer.paragraph(copy.purpose)
  writer.spacer(4)
  writer.paragraph(copy.countsLine, { muted: true, size: 9 })
  writer.spacer(8)
  writer.heading(copy.howToUseTitle)
  writer.paragraph(copy.howToUseBody)

  writer.heading(copy.startHereTitle)
  if (model.startHereContacts.length === 0) {
    writer.paragraph(copy.startHereEmpty, { muted: true })
  } else {
    for (const contact of model.startHereContacts) {
      const lines = contactBlock(contact, copy)
      writer.paragraph(lines[0] ?? '', { bold: true })
      for (const line of lines.slice(1)) {
        writer.paragraph(line, { size: 10 })
      }
      writer.spacer(6)
    }
  }

  writer.heading(copy.peopleTitle)
  if (model.contacts.length === 0) {
    writer.paragraph(copy.peopleEmpty, { muted: true })
  } else {
    for (const contact of model.contacts) {
      const lines = contactBlock(contact, copy)
      writer.paragraph(lines[0] ?? '', { bold: true })
      for (const line of lines.slice(1)) {
        writer.paragraph(line, { size: 10 })
      }
      writer.spacer(6)
    }
  }

  writer.heading(copy.instructionsTitle)
  if (model.instructions.length === 0) {
    writer.paragraph(copy.instructionsEmpty, { muted: true })
  } else {
    model.instructions.forEach((instruction, index) => {
      writer.paragraph(`${index + 1}. ${instruction.title}`, { bold: true, size: 11 })
      writer.paragraph(instruction.typeLabel, { muted: true, size: 9 })
      for (const line of instruction.bodyLines) {
        writer.paragraph(line)
      }
      for (const line of instruction.relatedLines) {
        writer.paragraph(line, { muted: true, size: 9 })
      }
      writer.spacer(8)
    })
  }

  writer.heading(copy.assetsTitle)
  writer.paragraph(copy.assetsHint, { muted: true, size: 9 })
  writer.spacer(4)
  if (model.assets.length === 0) {
    writer.paragraph(copy.assetsEmpty, { muted: true })
  } else {
    for (const asset of model.assets) {
      writer.paragraph(`${asset.categoryName} · ${asset.name}`, { bold: true })
      if (asset.institution) {
        writer.paragraph(`${copy.institutionLabel}: ${asset.institution}`)
      }
      if (asset.notes) {
        writer.paragraph(`${copy.notesLabel}: ${asset.notes}`)
      }
      const related = [...asset.relatedPeople, ...asset.relatedFiles]
      if (related.length > 0) {
        writer.paragraph(`${copy.relatedLabel}: ${related.join(', ')}`, { muted: true, size: 9 })
      }
      writer.spacer(6)
    }
  }

  writer.heading(copy.documentsTitle)
  writer.paragraph(copy.documentsHint, { muted: true, size: 9 })
  writer.spacer(4)
  if (model.documents.length === 0) {
    writer.paragraph(copy.documentsEmpty, { muted: true })
  } else {
    for (const document of model.documents) {
      writer.paragraph(document.pathLabel)
    }
  }

  writer.finish()
  return doc.save()
}
