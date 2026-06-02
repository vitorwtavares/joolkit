import { describe, it, expect, vi } from 'vitest'

vi.mock('../middleware/auth', () => ({
  getSupabase: vi.fn(),
}))

import * as authModule from '../middleware/auth'
import { deleteUserStorage } from './deleteUserStorage'

const mockGetSupabase = vi.mocked(authModule.getSupabase)

describe('deleteUserStorage', () => {
  it('throws and never touches storage when userId is empty', async () => {
    await expect(deleteUserStorage('')).rejects.toThrow()
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })
})
