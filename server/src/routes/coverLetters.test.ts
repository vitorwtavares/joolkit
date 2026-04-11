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
import coverLettersRouter from './coverLetters'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/cover-letters', coverLettersRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function mockUpsertChain(response: { data: unknown; error: unknown }) {
  const mockSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect })
  const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockUpsert }
}

function mockDeleteChain(response: { error: unknown }) {
  const mockEq2 = vi.fn().mockResolvedValue(response)
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
  const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete })
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockEq1, mockEq2 }
}

describe('PUT /api/cover-letters/:variation/file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid variation', async () => {
    const res = await request(buildApp())
      .put('/api/cover-letters/invalid/file')
      .send({ file_url: 'https://example.com/file.pdf' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'variation must be formal or light' })
  })

  it('returns 400 when file_url is missing', async () => {
    const res = await request(buildApp())
      .put('/api/cover-letters/formal/file')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'file_url is required' })
  })

  it('upserts with correct payload for formal variation', async () => {
    const { mockFrom, mockUpsert } = mockUpsertChain({
      data: {
        id: '1',
        variation: 'formal',
        file_url: 'https://example.com/file.pdf',
      },
      error: null,
    })

    const res = await request(buildApp())
      .put('/api/cover-letters/formal/file')
      .send({ file_url: 'https://example.com/file.pdf' })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('cover_letter_templates')
    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload).toMatchObject({
      user_id: 'test-user-id',
      variation: 'formal',
      file_url: 'https://example.com/file.pdf',
    })
    expect(upsertPayload).toHaveProperty('updated_at')
    expect(mockUpsert.mock.calls[0][1]).toEqual({
      onConflict: 'user_id,variation',
    })
  })

  it('upserts with correct payload for light variation', async () => {
    const { mockUpsert } = mockUpsertChain({
      data: {
        id: '2',
        variation: 'light',
        file_url: 'https://example.com/light.pdf',
      },
      error: null,
    })

    const res = await request(buildApp())
      .put('/api/cover-letters/light/file')
      .send({ file_url: 'https://example.com/light.pdf' })

    expect(res.status).toBe(200)
    expect(mockUpsert.mock.calls[0][0].variation).toBe('light')
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockUpsertChain({ data: null, error: { message: 'db error' } })

    const res = await request(buildApp())
      .put('/api/cover-letters/formal/file')
      .send({ file_url: 'https://example.com/file.pdf' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'db error' })
  })
})

describe('DELETE /api/cover-letters/:variation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid variation', async () => {
    const res = await request(buildApp()).delete('/api/cover-letters/other')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'variation must be formal or light' })
  })

  it('deletes formal variation and returns 204', async () => {
    const { mockFrom, mockEq1, mockEq2 } = mockDeleteChain({ error: null })

    const res = await request(buildApp()).delete('/api/cover-letters/formal')

    expect(res.status).toBe(204)
    expect(mockFrom).toHaveBeenCalledWith('cover_letter_templates')
    expect(mockEq1).toHaveBeenCalledWith('user_id', 'test-user-id')
    expect(mockEq2).toHaveBeenCalledWith('variation', 'formal')
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockDeleteChain({ error: { message: 'delete failed' } })

    const res = await request(buildApp()).delete('/api/cover-letters/light')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'delete failed' })
  })
})
