import { Router } from 'express'
import { getSupabase } from '../middleware/auth'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('tracker_view_settings')
    .select('*')
    .eq('user_id', req.userId!)

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

const VALID_VIEWS = [
  'all',
  'prospects',
  'ready',
  'applied',
  'in-progress',
  'no-openings',
  'favorites',
]

router.put('/:view', async (req, res) => {
  const { view } = req.params
  if (!VALID_VIEWS.includes(view as string))
    return res.status(400).json({ error: `Invalid view: ${view}` })

  const { column_order, hidden_columns } = req.body

  const { data, error } = await getSupabase()
    .from('tracker_view_settings')
    .upsert(
      {
        user_id: req.userId!,
        view,
        column_order: column_order ?? null,
        hidden_columns: hidden_columns ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,view' },
    )
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

export default router
