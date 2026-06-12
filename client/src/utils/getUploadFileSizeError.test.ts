import { describe, it, expect } from 'vitest'
import {
  MAX_UPLOAD_FILE_BYTES,
  getUploadFileSizeError,
} from './getUploadFileSizeError'

describe('getUploadFileSizeError', () => {
  it('returns null when the file is within the limit', () => {
    const file = new File(['x'], 'resume.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_FILE_BYTES })

    expect(getUploadFileSizeError(file)).toBeNull()
  })

  it('returns an error when the file exceeds the limit', () => {
    const file = new File(['x'], 'resume.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_FILE_BYTES + 1 })

    expect(getUploadFileSizeError(file)).toBe('PDF must be 2 MB or smaller.')
  })
})
