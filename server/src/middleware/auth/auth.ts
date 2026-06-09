import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

let supabase: SupabaseClient | undefined

export function initSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  supabase = createClient(url, key)
}

export function getSupabase(): SupabaseClient {
  if (!supabase)
    throw new Error(
      'Supabase client not initialized. Call initSupabase() first.',
    )
  return supabase
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.userId = user.id
  next()
}
