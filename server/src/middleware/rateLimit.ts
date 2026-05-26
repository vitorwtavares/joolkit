import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { getSupabase } from './auth'

interface RateLimitOptions {
  keyPrefix: string
  limit: number
  windowMs: number
  message: string
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
  keyGenerator,
}: RateLimitOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`

    const { data, error } = await getSupabase()
      .rpc('consume_api_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: Math.ceil(windowMs / 1000),
      })
      .single<RateLimitResult>()

    if (error || !data) {
      console.error('Rate limit check failed', error ?? 'no data returned')
      next()
      return
    }

    const resetSeconds = secondsUntil(data.reset_at)
    res.setHeader('RateLimit-Limit', String(limit))
    res.setHeader('RateLimit-Remaining', String(data.remaining))
    res.setHeader('RateLimit-Reset', String(resetSeconds))

    if (!data.allowed) {
      res.setHeader('Retry-After', String(resetSeconds))
      res.status(429).json({ error: message })
      return
    }

    next()
  }
}
