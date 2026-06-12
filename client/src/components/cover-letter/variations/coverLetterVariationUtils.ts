export const COVER_LETTER_FALLBACK_LABEL = 'Cover letter'
export const COVER_LETTER_LABEL_MAX_LENGTH = 40

export function getCoverLetterLabelValue(value: string): string {
  return value.trim().slice(0, COVER_LETTER_LABEL_MAX_LENGTH)
}

export function getCoverLetterFilename(path: string | null): string {
  if (!path) return 'cover-letter.pdf'
  return path.split('/').pop() ?? path
}

export function getCoverLetterTemplatePath(
  userId: string,
  variation: string | null,
  fileName: string,
): string {
  const folder = variation ?? crypto.randomUUID()
  return `${userId}/${folder}/${crypto.randomUUID()}/${fileName}`
}

export function getNextCoverLetterPosition(
  count: number,
  limit: number,
): number | null {
  const nextPosition = count + 1
  return nextPosition <= limit ? nextPosition : null
}
