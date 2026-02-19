export function truncateAtWord(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace <= 0) return slice.trim();
  return slice.slice(0, lastSpace).trim();
}
