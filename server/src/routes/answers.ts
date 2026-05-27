import { Router } from 'express'
import { getSupabase, AuthRequest } from '../middleware/auth'

const router = Router()

const MAX_ANSWERS = 12

router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await getSupabase()
    .from('answers')
    .select('*')
    .eq('user_id', req.userId!)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

router.post('/', async (req: AuthRequest, res) => {
  const { count, error: countError } = await getSupabase()
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.userId!)

  if (countError) return res.status(500).json({ error: countError.message })
  if ((count ?? 0) >= MAX_ANSWERS)
    return res
      .status(400)
      .json({ error: `Maximum of ${MAX_ANSWERS} answers reached` })

  const { question, short_answer, long_answer, preferred_variant } = req.body

  const { data, error } = await getSupabase()
    .from('answers')
    .insert({
      user_id: req.userId!,
      question: question ?? '',
      short_answer: short_answer ?? '',
      long_answer: long_answer ?? null,
      preferred_variant: preferred_variant ?? 'short',
      position: (count ?? 0) + 1,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

router.put('/reorder', async (req: AuthRequest, res) => {
  const { orderedIds } = req.body

  if (
    !Array.isArray(orderedIds) ||
    orderedIds.length === 0 ||
    orderedIds.length > MAX_ANSWERS ||
    !orderedIds.every((id) => typeof id === 'string' && id.length > 0)
  ) {
    return res.status(400).json({
      error: `orderedIds must be a non-empty array of at most ${MAX_ANSWERS} strings`,
    })
  }

  const { data: existing, error: fetchError } = await getSupabase()
    .from('answers')
    .select('id')
    .eq('user_id', req.userId!)

  if (fetchError) return res.status(500).json({ error: fetchError.message })
  const ownedIds = new Set(existing?.map((row) => row.id) ?? [])
  if (
    orderedIds.length !== ownedIds.size ||
    !orderedIds.every((id) => ownedIds.has(id))
  ) {
    return res.status(400).json({
      error: 'orderedIds must contain every answer for this user exactly once',
    })
  }

  const now = new Date().toISOString()
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await getSupabase()
      .from('answers')
      .update({ position: i + 1, updated_at: now })
      .eq('id', orderedIds[i])
      .eq('user_id', req.userId!)
    if (error) return res.status(500).json({ error: error.message })
  }

  const { data, error } = await getSupabase()
    .from('answers')
    .select('*')
    .eq('user_id', req.userId!)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

router.put('/:id', async (req: AuthRequest, res) => {
  const { question, short_answer, long_answer, preferred_variant } = req.body
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (question !== undefined) update.question = question
  if (short_answer !== undefined) update.short_answer = short_answer
  if (long_answer !== undefined) update.long_answer = long_answer
  if (preferred_variant !== undefined)
    update.preferred_variant = preferred_variant

  const { data, error } = await getSupabase()
    .from('answers')
    .update(update)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.json(data)
})

router.delete('/:id', async (req: AuthRequest, res) => {
  const { data: deleted, error: deleteError } = await getSupabase()
    .from('answers')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .maybeSingle()

  if (deleteError) return res.status(500).json({ error: deleteError.message })
  if (!deleted) return res.status(404).json({ error: 'Not found' })

  const { data: remaining, error: fetchError } = await getSupabase()
    .from('answers')
    .select('*')
    .eq('user_id', req.userId!)
    .order('position', { ascending: true })

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  const now = new Date().toISOString()
  const compacted = remaining ?? []
  for (let i = 0; i < compacted.length; i++) {
    const row = compacted[i]
    if (row.position === i + 1) continue
    const { error } = await getSupabase()
      .from('answers')
      .update({ position: i + 1, updated_at: now })
      .eq('id', row.id)
      .eq('user_id', req.userId!)
    if (error) return res.status(500).json({ error: error.message })
    row.position = i + 1
    row.updated_at = now
  }

  return res.json(compacted)
})

export default router
