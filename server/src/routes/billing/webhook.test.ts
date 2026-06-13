import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../middleware/auth', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../middleware/auth')>()
  return { ...original, getSupabase: vi.fn() }
})
vi.mock('../../billing/stripe', () => ({ getStripe: vi.fn() }))
vi.mock('../../billing/sync', () => ({ syncSubscriptionFromStripe: vi.fn() }))

import * as authModule from '../../middleware/auth'
import * as stripeModule from '../../billing/stripe'
import * as syncModule from '../../billing/sync'
import { handleStripeWebhook } from './webhook'

const mockGetSupabase = vi.mocked(authModule.getSupabase)
const mockGetStripe = vi.mocked(stripeModule.getStripe)
const mockSync = vi.mocked(syncModule.syncSubscriptionFromStripe)

const EVENT = {
  id: 'evt_1',
  type: 'customer.subscription.updated',
  data: { object: { id: 'sub_1' } },
}

function buildApp() {
  const app = express()
  app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook,
  )
  return app
}

const RETRIEVED_SUB = { id: 'sub_1', status: 'active' }

function mockStripe() {
  mockGetStripe.mockReturnValue({
    webhooks: { constructEvent: vi.fn().mockReturnValue(EVENT) },
    subscriptions: { retrieve: vi.fn().mockResolvedValue(RETRIEVED_SUB) },
  } as never)
}

function mockSupabase({ seen }: { seen: boolean }) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: seen ? { id: 'evt_1' } : null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const insert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ select, insert })
  mockGetSupabase.mockReturnValue({ from } as never)
  return { insert }
}

function post() {
  return request(buildApp())
    .post('/api/billing/webhook')
    .set('stripe-signature', 'sig')
    .set('Content-Type', 'application/json')
    .send(Buffer.from('{}'))
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
})

describe('POST /api/billing/webhook', () => {
  it('skips processing an already-seen event (idempotency)', async () => {
    mockStripe()
    mockSupabase({ seen: true })

    const res = await post()

    expect(res.status).toBe(200)
    expect(mockSync).not.toHaveBeenCalled()
  })

  it('processes a new subscription event and records it', async () => {
    mockStripe()
    const { insert } = mockSupabase({ seen: false })

    const res = await post()

    expect(res.status).toBe(200)
    expect(mockSync).toHaveBeenCalledWith(RETRIEVED_SUB)
    expect(insert).toHaveBeenCalledWith({
      id: 'evt_1',
      type: 'customer.subscription.updated',
    })
  })

  it('rejects when the webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    mockStripe()
    mockSupabase({ seen: false })

    const res = await post()

    expect(res.status).toBe(500)
    expect(mockSync).not.toHaveBeenCalled()
  })
})
