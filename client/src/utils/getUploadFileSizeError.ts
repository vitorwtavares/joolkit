export const MAX_UPLOAD_FILE_BYTES = 2 * 1024 * 1024
const MAX_UPLOAD_FILE_LABEL = '2 MB'

export function getUploadFileSizeError(file: File): string | null {
  if (file.size <= MAX_UPLOAD_FILE_BYTES) return null
  return `PDF must be ${MAX_UPLOAD_FILE_LABEL} or smaller.`
}
