import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { AuthRequest } from '../middleware/auth'

vi.mock('../middleware/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/auth')>()
  return {
    ...original,
    getSupabase: vi.fn(),
    authMiddleware: (
      req: AuthRequest,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.userId = 'test-user-id'
      next()
    },
  }
})

import * as authModule from '../middleware/auth'
import profileRouter from './profile'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/profile', profileRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function mockUpdateChain(response: { data: unknown; error: unknown }) {
  const mockSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockUpdate }
}

describe('PUT /api/profile — field whitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips disallowed fields from the update payload', async () => {
    const { mockUpdate } = mockUpdateChain({
      data: { id: 'test-user-id', name: 'Alice' },
      error: null,
    })

    await request(buildApp())
      .put('/api/profile')
      .send({
        id: 'injected',
        user_id: 'injected',
        name: 'Alice',
        unknown_field: 'x',
      })

    expect(mockUpdate).toHaveBeenCalledOnce()
    const updatePayload = mockUpdate.mock.calls[0][0]
    expect(updatePayload).not.toHaveProperty('id')
    expect(updatePayload).not.toHaveProperty('user_id')
    expect(updatePayload).not.toHaveProperty('unknown_field')
    expect(updatePayload).toHaveProperty('name', 'Alice')
    expect(updatePayload).toHaveProperty('updated_at')
  })

  it('passes all allowed fields through to the update payload', async () => {
    const { mockUpdate } = mockUpdateChain({ data: {}, error: null })

    const allowedBody = {
      name: 'Alice',
      email: 'alice@example.com',
      phone: '555-1234',
      address: '123 Main St',
      linkedin: 'https://linkedin.com/in/alice',
      github: 'https://github.com/alice',
      portfolio: 'https://alice.dev',
      other_link: 'https://blog.alice.dev',
      resume_url: 'https://storage.example.com/resume.pdf',
    }

    await request(buildApp()).put('/api/profile').send(allowedBody)

    expect(mockUpdate.mock.calls[0][0]).toMatchObject(allowedBody)
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockUpdateChain({ data: null, error: { message: 'update failed' } })

    const res = await request(buildApp())
      .put('/api/profile')
      .send({ name: 'Alice' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'update failed' })
  })
})
