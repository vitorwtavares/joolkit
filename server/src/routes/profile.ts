import { Router } from 'express'
import { getSupabase, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (req: AuthRequest, res) => {
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

router.put('/', async (req: AuthRequest, res) => {
  const { name, email, phone, address, linkedin, github, portfolio, other_link, resume_url } = req.body

  const { data, error } = await getSupabase()
    .from('profiles')
    .update({ name, email, phone, address, linkedin, github, portfolio, other_link, resume_url, updated_at: new Date().toISOString() })
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
