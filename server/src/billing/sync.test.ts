import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../middleware/auth', () => ({ getSupabase: vi.fn() }))
vi.mock('./stripe', () => ({ getStripe: vi.fn() }))
vi.mock('./archive', () => ({ applyPlanTransition: vi.fn() }))

import * as authModule from '../middleware/auth'
import * as archiveModule from './archive'
import { syncSubscriptionFromStripe } from './sync'

const mockGetSupabase = vi.mocked(authModule.getSupabase)
const mockApplyTransition = vi.mocked(archiveModule.applyPlanTransition)

const FUTURE_SECONDS = Math.floor((Date.now() + 1_000_000_000) / 1000)
const FUTURE_ISO = new Date(FUTURE_SECONDS * 1000).toISOString()

// Sequences the three subscriptions queries sync makes: resolveUserId, the prior
// entitlement read, then the upsert.
function mockSupabase(
  prior: {
    status: string | null
    current_period_end: string | null
  } | null,
) {
  const resolveBuilder = {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: { user_id: 'u1' } }),
      }),
    }),
  }
  const priorBuilder = {
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: prior }) }),
    }),
  }
  const upsertBuilder = { upsert: () => Promise.resolve({ error: null }) }

  const from = vi
    .fn()
    .mockReturnValueOnce(resolveBuilder)
    .mockReturnValueOnce(priorBuilder)
    .mockReturnValueOnce(upsertBuilder)
  mockGetSupabase.mockReturnValue({ from } as never)
}

function subscription(status: string, periodEndSeconds: number | null) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status,
    currency: 'usd',
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: {
            id: 'price_1',
            recurring: { interval: 'month', interval_count: 1 },
          },
          current_period_end: periodEndSeconds,
        },
      ],
    },
  } as never
}

beforeEach(() => vi.clearAllMocks())

describe('syncSubscriptionFromStripe — archive transition', () => {
  it('archives overflow on a Pro→Free downgrade', async () => {
    mockSupabase({ status: 'active', current_period_end: FUTURE_ISO })

    await syncSubscriptionFromStripe(subscription('canceled', null))

    expect(mockApplyTransition).toHaveBeenCalledWith('u1', true, false)
  })

  it('restores data on a Free→Pro upgrade', async () => {
    mockSupabase({ status: 'canceled', current_period_end: null })

    await syncSubscriptionFromStripe(subscription('active', FUTURE_SECONDS))

    expect(mockApplyTransition).toHaveBeenCalledWith('u1', false, true)
  })

  it('passes a no-op transition when entitlement is unchanged (Pro→Pro)', async () => {
    mockSupabase({ status: 'active', current_period_end: FUTURE_ISO })

    await syncSubscriptionFromStripe(subscription('active', FUTURE_SECONDS))

    expect(mockApplyTransition).toHaveBeenCalledWith('u1', true, true)
  })
})
