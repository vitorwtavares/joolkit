import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { PLAN_LIMITS } from '../../billing/plans'

vi.mock('../../middleware/auth', () => ({
  getSupabase: vi.fn(),
}))
vi.mock('../../billing/stripe', () => ({ getStripe: vi.fn() }))
vi.mock('../../billing/customer', () => ({ getOrCreateCustomer: vi.fn() }))
vi.mock('../../billing/entitlement', () => ({ getUserEntitlement: vi.fn() }))
vi.mock('../../billing/usage', () => ({ getUsageBreakdown: vi.fn() }))
vi.mock('../../billing/pdfQuota', () => ({ getPdfExportUsage: vi.fn() }))

import * as entitlementModule from '../../billing/entitlement'
import * as usageModule from '../../billing/usage'
import * as pdfQuotaModule from '../../billing/pdfQuota'
import billingRouter from '.'

const mockGetEntitlement = vi.mocked(entitlementModule.getUserEntitlement)
const mockGetUsage = vi.mocked(usageModule.getUsageBreakdown)
const mockGetPdfUsage = vi.mocked(pdfQuotaModule.getPdfExportUsage)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.userId = 'test-user-id'
    next()
  })
  app.use('/api/billing', billingRouter)
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetPdfUsage.mockResolvedValue({
    limit: PLAN_LIMITS.free.pdfExportsPerDay,
    used: 0,
    remaining: PLAN_LIMITS.free.pdfExportsPerDay,
    resetAt: null,
  })
})

describe('GET /api/billing/status', () => {
  it('reports per-resource usage and the count hidden beyond Free limits', async () => {
    mockGetEntitlement.mockResolvedValue({
      plan: 'free',
      limits: PLAN_LIMITS.free,
      subscription: null,
    })
    const active = {
      applications: 50,
      answers: 4,
      resumeVariations: 1,
      coverLetterVariations: 1,
      tokenDefinitions: 4,
    }
    const archived = {
      applications: 10,
      answers: 6,
      resumeVariations: 2,
      coverLetterVariations: 0,
      tokenDefinitions: 3,
    }
    mockGetUsage.mockResolvedValue({ active, archived })

    mockGetPdfUsage.mockResolvedValue({
      limit: PLAN_LIMITS.free.pdfExportsPerDay,
      used: PLAN_LIMITS.free.pdfExportsPerDay,
      remaining: 0,
      resetAt: '2026-06-12T00:00:00Z',
    })

    const res = await request(buildApp()).get('/api/billing/status')

    expect(res.status).toBe(200)
    expect(res.body.plan).toBe('free')
    // usage reflects the active set, hidden reflects archived (downgrade) rows.
    expect(res.body.usage).toEqual(active)
    expect(res.body.hidden).toEqual(archived)
    // today's PDF-export quota is surfaced for the client's export controls.
    expect(res.body.pdfExports).toEqual({
      limit: PLAN_LIMITS.free.pdfExportsPerDay,
      used: PLAN_LIMITS.free.pdfExportsPerDay,
      remaining: 0,
      resetAt: '2026-06-12T00:00:00Z',
    })
  })

  it('reports zero hidden when nothing is archived (Pro)', async () => {
    mockGetEntitlement.mockResolvedValue({
      plan: 'pro',
      limits: PLAN_LIMITS.pro,
      subscription: null,
    })
    const active = {
      applications: 120,
      answers: 30,
      resumeVariations: 5,
      coverLetterVariations: 4,
      tokenDefinitions: 99,
    }
    const archived = {
      applications: 0,
      answers: 0,
      resumeVariations: 0,
      coverLetterVariations: 0,
      tokenDefinitions: 0,
    }
    mockGetUsage.mockResolvedValue({ active, archived })

    const res = await request(buildApp()).get('/api/billing/status')

    expect(res.status).toBe(200)
    expect(res.body.hidden).toEqual(archived)
  })
})
