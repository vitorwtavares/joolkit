import { Router } from 'express'
import { getSupabase } from '../middleware/auth'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', req.userId!)
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.put('/', async (req, res) => {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'address',
    'linkedin',
    'github',
    'portfolio',
    'other_link',
    'resume_url',
  ] as const
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const field of allowedFields) {
    if (field in req.body) updates[field] = req.body[field]
  }

  const { data, error } = await getSupabase()
    .from('profiles')
    .update(updates)
    .eq('id', req.userId!)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
