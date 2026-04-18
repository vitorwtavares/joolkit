import { Router } from 'express'
import { getSupabase, AuthRequest } from '../middleware/auth'

const router = Router()

const MAX_ANSWERS = 8

function isValidPosition(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_ANSWERS
  )
}

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

  const { question, short_answer, long_answer, preferred_variant, position } =
    req.body

  if (!isValidPosition(position)) {
    return res
      .status(400)
      .json({
        error: `position must be an integer between 1 and ${MAX_ANSWERS}`,
      })
  }

  const { data, error } = await getSupabase()
    .from('answers')
    .insert({
      user_id: req.userId!,
      question: question ?? '',
      short_answer: short_answer ?? '',
      long_answer: long_answer ?? null,
      preferred_variant: preferred_variant ?? 'short',
      position,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
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

router.put('/:id/position', async (req: AuthRequest, res) => {
  const { position } = req.body

  if (!isValidPosition(position)) {
    return res
      .status(400)
      .json({
        error: `position must be an integer between 1 and ${MAX_ANSWERS}`,
      })
  }

  const { data, error } = await getSupabase()
    .from('answers')
    .update({ position, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.json(data)
})

router.delete('/:id', async (req: AuthRequest, res) => {
  const { error } = await getSupabase()
    .from('answers')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(204).send()
})

export default router
