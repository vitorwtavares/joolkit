import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../middleware/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/auth')>()
  return { ...original, getSupabase: vi.fn() }
})
vi.mock('./stripe', () => ({ getStripe: vi.fn() }))

import * as authModule from '../middleware/auth'
import * as stripeModule from './stripe'
import { cancelActiveSubscription } from './cancel'

const mockGetSupabase = vi.mocked(authModule.getSupabase)
const mockGetStripe = vi.mocked(stripeModule.getStripe)

function mockSupabase(
  row: { stripe_subscription_id: string | null; status: string | null } | null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  mockGetSupabase.mockReturnValue({ from } as never)
}

function mockStripe() {
  const cancel = vi.fn().mockResolvedValue({})
  mockGetStripe.mockReturnValue({ subscriptions: { cancel } } as never)
  return { cancel }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cancelActiveSubscription', () => {
  it('no-ops when there is no subscription row', async () => {
    mockSupabase(null)
    const { cancel } = mockStripe()

    await cancelActiveSubscription('u1')

    expect(cancel).not.toHaveBeenCalled()
  })

  it('no-ops when there is no stripe subscription id', async () => {
    mockSupabase({ stripe_subscription_id: null, status: null })
    const { cancel } = mockStripe()

    await cancelActiveSubscription('u1')

    expect(cancel).not.toHaveBeenCalled()
  })

  it('cancels the live subscription at Stripe', async () => {
    mockSupabase({ stripe_subscription_id: 'sub_1', status: 'active' })
    const { cancel } = mockStripe()

    await cancelActiveSubscription('u1')

    expect(cancel).toHaveBeenCalledWith('sub_1')
  })

  it('skips an already-canceled subscription', async () => {
    mockSupabase({ stripe_subscription_id: 'sub_1', status: 'canceled' })
    const { cancel } = mockStripe()

    await cancelActiveSubscription('u1')

    expect(cancel).not.toHaveBeenCalled()
  })
})
