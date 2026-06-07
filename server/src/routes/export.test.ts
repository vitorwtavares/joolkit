import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createRateLimitMiddleware: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  ),
}))

vi.mock('../middleware/rateLimit', () => ({
  createRateLimitMiddleware: mocks.createRateLimitMiddleware,
}))

vi.mock('../middleware/auth', () => ({
  getSupabase: vi.fn(),
}))

vi.mock('../utils/browser', () => ({
  getBrowser: vi.fn(),
}))

describe('export route limits', () => {
  it('limits cover letter PDF exports to 10 per rolling day', async () => {
    const router = await import('./export')

    expect(router.default).toBeDefined()
    expect(mocks.createRateLimitMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        keyPrefix: 'pdf-export',
        windowMs: 24 * 60 * 60 * 1000,
        limit: 10,
        message:
          'PDF export limit reached. You can export up to 10 cover letters every 24 hours.',
      }),
    )
  })
})
