import type { Request, RequestHandler } from 'express'
import type { LimitResource } from '../../billing/limits'
import { getSupabase } from '../auth'

interface RateLimitOptions {
  keyPrefix: string
  // A function resolves the limit per request (e.g. per the caller's plan).
  limit: number | ((req: Request) => number | Promise<number>)
  windowMs: number
  message: string
  // Optional machine-readable code attached to the 429 body (e.g. 'plan_limit')
  // so the client can tell a plan cap apart from a generic throttle.
  code?: string
  // With `code: 'plan_limit'`, include resource/plan/limit on 429 so the client
  // can open an upgrade prompt (reads plan from req.entitlement when set).
  planLimitResource?: LimitResource
  keyGenerator: (req: Request) => string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset_at: string
}

function secondsUntil(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 1000))
}

export function createRateLimitMiddleware({
  keyPrefix,
  limit,
  windowMs,
  message,
  code,
  planLimitResource,
  keyGenerator,
}: RateLimitOptions): RequestHandler {
  return (async (req, res, next) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`
    const resolvedLimit = typeof limit === 'function' ? await limit(req) : limit

    const { data, error } = await getSupabase()
      .rpc('consume_api_rate_limit', {
        p_key: key,
        p_limit: resolvedLimit,
        p_window_seconds: Math.ceil(windowMs / 1000),
      })
      .single<RateLimitResult>()

    if (error || !data) {
      console.error('Rate limit check failed', error ?? 'no data returned')
      next()
      return
    }

    const resetSeconds = secondsUntil(data.reset_at)
    res.setHeader('RateLimit-Limit', String(resolvedLimit))
    res.setHeader('RateLimit-Remaining', String(data.remaining))
    res.setHeader('RateLimit-Reset', String(resetSeconds))

    if (!data.allowed) {
      res.setHeader('Retry-After', String(resetSeconds))
      const body: Record<string, unknown> = {
        error: message,
        ...(code ? { code } : {}),
      }
      if (code === 'plan_limit' && planLimitResource) {
        body.resource = planLimitResource
        body.plan = req.entitlement?.plan ?? 'free'
        body.limit = resolvedLimit
      }
      res.status(429).json(body)
      return
    }

    next()
  }) as RequestHandler
}
