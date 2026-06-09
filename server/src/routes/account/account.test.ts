import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../middleware/auth', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../middleware/auth')>()
  return {
    ...original,
    getSupabase: vi.fn(),
    authMiddleware: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.userId = 'test-user-id'
      next()
    },
  }
})

import * as authModule from '../../middleware/auth'
import accountRouter from '.'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/account', accountRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function mockSupabase({ deleteError = null }: { deleteError?: unknown } = {}) {
  const deleteUser = vi.fn().mockResolvedValue({ data: {}, error: deleteError })
  const list = vi.fn().mockResolvedValue({
    data: [{ name: 'resume.pdf', id: 'file-1' }],
    error: null,
  })
  const remove = vi.fn().mockResolvedValue({ data: [], error: null })
  const from = vi.fn().mockReturnValue({ list, remove })
  mockGetSupabase.mockReturnValue({
    auth: { admin: { deleteUser } },
    storage: { from },
  } as never)
  return { deleteUser, from, list, remove }
}

describe('DELETE /api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the authenticated user and returns 204', async () => {
    const { deleteUser } = mockSupabase()

    const res = await request(buildApp()).delete('/api/account')

    expect(res.status).toBe(204)
    expect(deleteUser).toHaveBeenCalledWith('test-user-id')
  })

  it('removes the user storage files from every bucket after deletion', async () => {
    const { from, remove } = mockSupabase()

    await request(buildApp()).delete('/api/account')

    expect(from).toHaveBeenCalledWith('resumes')
    expect(from).toHaveBeenCalledWith('cover-letters')
    expect(remove).toHaveBeenCalledWith(['test-user-id/resume.pdf'])
  })

  it('returns 500 and skips storage cleanup when the delete fails', async () => {
    const { from } = mockSupabase({ deleteError: { message: 'delete failed' } })

    const res = await request(buildApp()).delete('/api/account')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'delete failed' })
    expect(from).not.toHaveBeenCalled()
  })
})
