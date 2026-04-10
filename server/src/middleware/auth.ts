import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Request, Response, NextFunction } from 'express'

let supabase: SupabaseClient

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
  return supabase
}

export interface AuthRequest extends Request {
  userId?: string
}

export async function authMiddleware(
  req: AuthRequest,
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
  } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.userId = user.id
  next()
}
