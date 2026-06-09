import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('skills')
    .select('*')
    .eq('user_id', req.userId!)
    .order('name', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await getSupabase()
    .from('skills')
    .insert({ user_id: req.userId!, name: name.trim() })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await getSupabase()
    .from('skills')
    .update({ name: name.trim() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { data: deleted, error } = await getSupabase()
    .from('skills')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!deleted) return res.status(404).json({ error: 'Not found' })
  return res.json({ id: deleted.id })
})

export default router
