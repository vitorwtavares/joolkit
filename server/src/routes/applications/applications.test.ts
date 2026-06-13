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
      req.userId = USER_ID
      next()
    },
  }
})

import * as authModule from '../../middleware/auth'
import applicationsRouter from '.'
import { PLAN_LIMITS, type Plan } from '../../billing/plans'

const USER_ID = 'test-user-id'
const mockGetSupabase = vi.mocked(authModule.getSupabase)

function buildApp(plan: Plan = 'pro') {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use((req, _res, next) => {
    req.entitlement = { plan, limits: PLAN_LIMITS[plan], subscription: null }
    next()
  })
  app.use('/api/applications', applicationsRouter)
  return app
}

// Builder for `.select().eq().order().limit()` (the list endpoint).
// List query: `.select().eq().is('archived_at', null).order()`.
function listBuilder(response: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(response)
  const is = vi.fn().mockReturnValue({ order })
  const eq = vi.fn().mockReturnValue({ is })
  const select = vi.fn().mockReturnValue({ eq })
  return { builder: { select }, select, eq, is, order }
}

// Create-cap count over the active set: `.select(*, head).eq().is()`.
function countBuilder(count: number | null, error: unknown = null) {
  const is = vi.fn().mockResolvedValue({ count, error })
  const eq = vi.fn().mockReturnValue({ is })
  const select = vi.fn().mockReturnValue({ eq })
  return { builder: { select }, eq, is }
}

// Fetch one by id: `.select().eq().eq().maybeSingle()`.
function byIdBuilder(response: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const eq2 = vi.fn().mockReturnValue({ maybeSingle })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const select = vi.fn().mockReturnValue({ eq: eq1 })
  return { builder: { select }, maybeSingle }
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/applications', () => {
  it('returns only active applications (archived rows excluded)', async () => {
    const list = listBuilder({ data: [], error: null })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(list.builder),
    } as never)

    await request(buildApp('free')).get('/api/applications')

    expect(list.is).toHaveBeenCalledWith('archived_at', null)
  })
})

describe('POST /api/applications', () => {
  it('counts only active rows and blocks a Free user at the cap', async () => {
    const count = countBuilder(50)
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(count.builder),
    } as never)

    const res = await request(buildApp('free'))
      .post('/api/applications')
      .send({ company_name: 'Acme' })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      code: 'plan_limit',
      resource: 'applications',
      plan: 'free',
      limit: 50,
    })
    expect(count.is).toHaveBeenCalledWith('archived_at', null)
  })
})

describe('GET /api/applications/:id direct access', () => {
  it('serves an active record', async () => {
    const row = { id: 'app-1', archived_at: null }
    const fetchOne = byIdBuilder({ data: row, error: null })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(fetchOne.builder),
    } as never)

    const res = await request(buildApp('free')).get('/api/applications/app-1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(row)
  })

  it('blocks an archived record with plan_limit', async () => {
    const row = { id: 'app-old', archived_at: '2026-05-01T00:00:00Z' }
    const fetchOne = byIdBuilder({ data: row, error: null })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(fetchOne.builder),
    } as never)

    const res = await request(buildApp('free')).get('/api/applications/app-old')

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      code: 'plan_limit',
      resource: 'applications',
      plan: 'free',
      limit: 50,
    })
  })
})
