import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../auth', () => ({
  getSupabase: vi.fn(),
}))

import { PLAN_LIMITS } from '../../billing/plans'
import { getSupabase } from '../auth'
import { createRateLimitMiddleware } from './rateLimit'

const mockGetSupabase = vi.mocked(getSupabase)

function buildRpc(response: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const rpc = vi.fn().mockReturnValue({ single })
  mockGetSupabase.mockReturnValue({ rpc } as never)
  return { rpc, single }
}

function buildApp() {
  const app = express()
  app.use(
    createRateLimitMiddleware({
      keyPrefix: 'test',
      limit: 2,
      windowMs: 60_000,
      message: 'Too many requests',
      keyGenerator: () => 'user-1',
    }),
  )
  app.get('/test', (_req, res) => res.json({ ok: true }))
  return app
}

describe('createRateLimitMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows requests under the limit and sets rate limit headers', async () => {
    const { rpc } = buildRpc({
      data: {
        allowed: true,
        remaining: 1,
        reset_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })

    const res = await request(buildApp()).get('/test')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(res.headers['ratelimit-limit']).toBe('2')
    expect(res.headers['ratelimit-remaining']).toBe('1')
    expect(rpc).toHaveBeenCalledWith('consume_api_rate_limit', {
      p_key: 'test:user-1',
      p_limit: 2,
      p_window_seconds: 60,
    })
  })

  it('returns 429 when the limit is exceeded', async () => {
    buildRpc({
      data: {
        allowed: false,
        remaining: 0,
        reset_at: new Date(Date.now() + 30_000).toISOString(),
      },
      error: null,
    })

    const res = await request(buildApp()).get('/test')

    expect(res.status).toBe(429)
    expect(res.body).toEqual({ error: 'Too many requests' })
    expect(res.headers['retry-after']).toBeDefined()
  })

  it('includes structured plan_limit fields when configured', async () => {
    buildRpc({
      data: {
        allowed: false,
        remaining: 0,
        reset_at: new Date(Date.now() + 30_000).toISOString(),
      },
      error: null,
    })

    const app = express()
    app.use((req, _res, next) => {
      req.entitlement = {
        plan: 'free',
        limits: PLAN_LIMITS.free,
        subscription: null,
      }
      next()
    })
    app.use(
      createRateLimitMiddleware({
        keyPrefix: 'pdf-export',
        limit: 1,
        windowMs: 86_400_000,
        message: 'Daily PDF export limit reached',
        code: 'plan_limit',
        planLimitResource: 'pdfExports',
        keyGenerator: () => 'user-1',
      }),
    )
    app.get('/test', (_req, res) => res.json({ ok: true }))

    const res = await request(app).get('/test')

    expect(res.status).toBe(429)
    expect(res.body).toEqual({
      error: 'Daily PDF export limit reached',
      code: 'plan_limit',
      resource: 'pdfExports',
      plan: 'free',
      limit: 1,
    })
  })

  it('fails open when the rate limit check fails', async () => {
    buildRpc({ data: null, error: { message: 'db unavailable' } })

    const res = await request(buildApp()).get('/test')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
