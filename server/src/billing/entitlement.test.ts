import { describe, it, expect } from 'vitest'
import {
  isProEntitled,
  getEntitlement,
  type SubscriptionRow,
} from './entitlement'
import { PLAN_LIMITS } from './plans'

function row(overrides: Partial<SubscriptionRow>): SubscriptionRow {
  return {
    user_id: 'u1',
    stripe_customer_id: 'cus_1',
    stripe_subscription_id: 'sub_1',
    stripe_price_id: 'price_1',
    plan: 'pro',
    status: 'active',
    billing_interval: 'monthly',
    currency: 'usd',
    current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
    cancel_at_period_end: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('isProEntitled', () => {
  it('is free when there is no subscription', () => {
    expect(isProEntitled(null)).toBe(false)
  })

  it('is pro when active with a future period end', () => {
    expect(isProEntitled(row({}))).toBe(true)
  })

  it('is pro when trialing with a future period end', () => {
    expect(isProEntitled(row({ status: 'trialing' }))).toBe(true)
  })

  it('stays pro when cancel_at_period_end but period has not elapsed', () => {
    expect(isProEntitled(row({ cancel_at_period_end: true }))).toBe(true)
  })

  it('is free when active but the period already elapsed', () => {
    expect(
      isProEntitled(
        row({ current_period_end: new Date(Date.now() - 1000).toISOString() }),
      ),
    ).toBe(false)
  })

  it('is free when canceled', () => {
    expect(isProEntitled(row({ status: 'canceled' }))).toBe(false)
  })

  it('is free when past_due', () => {
    expect(isProEntitled(row({ status: 'past_due' }))).toBe(false)
  })
})

describe('getEntitlement', () => {
  it('returns the free plan and free limits for no subscription', () => {
    const ent = getEntitlement(null)
    expect(ent.plan).toBe('free')
    expect(ent.limits).toBe(PLAN_LIMITS.free)
  })

  it('returns the pro plan and pro limits for an active subscription', () => {
    const ent = getEntitlement(row({}))
    expect(ent.plan).toBe('pro')
    expect(ent.limits).toBe(PLAN_LIMITS.pro)
  })
})
