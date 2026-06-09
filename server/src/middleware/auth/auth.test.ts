import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const mockGetUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

import { authMiddleware, initSupabase } from './auth'

initSupabase()

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authMiddleware)
  app.get('/test', (req, res) => {
    res.json({ userId: req.userId })
  })
  return app
}

describe('authMiddleware', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(buildApp()).get('/test')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when Authorization header lacks Bearer prefix', async () => {
    const res = await request(buildApp())
      .get('/test')
      .set('Authorization', 'Token abc123')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when Supabase getUser returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid jwt' },
    })
    const res = await request(buildApp())
      .get('/test')
      .set('Authorization', 'Bearer badtoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when Supabase getUser returns null user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await request(buildApp())
      .get('/test')
      .set('Authorization', 'Bearer validish')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('attaches userId and calls next on valid token', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    const res = await request(buildApp())
      .get('/test')
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ userId: 'user-123' })
  })
})
