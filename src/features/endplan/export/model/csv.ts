export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export function toCsvRow(cells: readonly string[]): string {
  return cells.map((cell) => escapeCsvCell(cell)).join(',')
}

export function toCsvDocument(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [toCsvRow(headers), ...rows.map((row) => toCsvRow(row))]
  return `${lines.join('\r\n')}\r\n`
}
