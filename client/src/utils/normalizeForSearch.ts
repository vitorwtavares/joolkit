// Lowercases and strips diacritics so accented and unaccented text match (e.g. "Sa" matches "São Paulo").
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
