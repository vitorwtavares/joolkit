import { Router } from 'express'
import { getSupabase, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/cover-letters
router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .select('*')
    .eq('user_id', req.userId!)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// GET /api/cover-letters/tokens
router.get('/tokens', async (req: AuthRequest, res) => {
  const { data, error } = await getSupabase()
    .from('cover_letter_tokens')
    .select('*')
    .eq('user_id', req.userId!)
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// PUT /api/cover-letters/tokens
router.put('/tokens', async (req: AuthRequest, res) => {
  const { role, company } = req.body

  const { data, error } = await getSupabase()
    .from('cover_letter_tokens')
    .upsert({ user_id: req.userId!, role, company, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// PUT /api/cover-letters/:variation/file
router.put('/:variation/file', async (req: AuthRequest, res) => {
  const { variation } = req.params
  if (variation !== 'formal' && variation !== 'light') {
    res.status(400).json({ error: 'variation must be formal or light' })
    return
  }

  const { file_url } = req.body
  if (!file_url) {
    res.status(400).json({ error: 'file_url is required' })
    return
  }

  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .upsert({ user_id: req.userId!, variation, file_url, updated_at: new Date().toISOString() }, { onConflict: 'user_id,variation' })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
