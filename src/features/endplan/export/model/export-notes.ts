export function buildExportNotesFile(lines: readonly string[]): string {
  return `${lines.filter((line) => line.length > 0).join('\n')}\n`
}
