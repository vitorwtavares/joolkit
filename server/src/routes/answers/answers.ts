import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'
import { sendPlanLimit } from '../../billing/limits'

const router = Router()

// Absolute ceiling (the Pro cap), used to sanity-bound the reorder payload.
const MAX_ANSWERS = 40
const MAX_TAGS = 8
const MAX_TAG_LENGTH = 24

function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of input) {
    if (typeof raw !== 'string') continue
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
    if (result.length >= MAX_TAGS) break
  }
  return result
}

// Returns only active answers. Answers archived by a downgrade stay stored but
// hidden until the user resubscribes.
router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('answers')
    .select('*')
    .eq('user_id', req.userId!)
    .is('archived_at', null)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

router.post('/', async (req, res) => {
  const { count, error: countError } = await getSupabase()
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.userId!)
    .is('archived_at', null)

  if (countError) return res.status(500).json({ error: countError.message })
  const { plan, limits } = req.entitlement!
  if ((count ?? 0) >= limits.answers)
    return sendPlanLimit(res, 'answers', limits.answers, plan)

  const { question, short_answer, long_answer, preferred_variant, tags } =
    req.body

  const { data, error } = await getSupabase()
    .from('answers')
    .insert({
      user_id: req.userId!,
      question: question ?? '',
      short_answer: short_answer ?? '',
      long_answer: long_answer ?? null,
      preferred_variant: preferred_variant ?? 'short',
      tags: sanitizeTags(tags),
      position: (count ?? 0) + 1,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

router.put('/reorder', async (req, res) => {
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
    .is('archived_at', null)

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
    .is('archived_at', null)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

router.put('/:id', async (req, res) => {
  const { question, short_answer, long_answer, preferred_variant, tags } =
    req.body
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (question !== undefined) update.question = question
  if (short_answer !== undefined) update.short_answer = short_answer
  if (long_answer !== undefined) update.long_answer = long_answer
  if (preferred_variant !== undefined)
    update.preferred_variant = preferred_variant
  if (tags !== undefined) update.tags = sanitizeTags(tags)

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

router.delete('/:id', async (req, res) => {
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
    .is('archived_at', null)
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
