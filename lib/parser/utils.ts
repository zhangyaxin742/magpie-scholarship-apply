const FOOTER_RE = /CA\s+\S+,\s+\S+\s+CEEB:\s*\d+\s+Fall\s+\d+\s+\d+\s+FY\s+RD\s+CAID:\s*\d+\s*\n?PREVIEW/gi;

const withoutGlobal = (regex: RegExp) => new RegExp(regex.source, regex.flags.replace('g', ''));

export function stripFooters(text: string): string {
  return text.replace(FOOTER_RE, '');
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractSection(text: string, start: RegExp, end: RegExp): string | null {
  const startMatch = withoutGlobal(start).exec(text);
  if (!startMatch || startMatch.index === undefined) return null;
  const startIndex = startMatch.index + startMatch[0].length;
  const remainder = text.slice(startIndex);
  const endMatch = withoutGlobal(end).exec(remainder);
  if (!endMatch || endMatch.index === undefined) {
    return remainder.trim();
  }
  return remainder.slice(0, endMatch.index).trim();
}

export function truncateAtWord(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace <= 0) return slice.trim();
  return slice.slice(0, lastSpace).trim();
}
