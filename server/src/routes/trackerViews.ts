import { Router } from 'express'
import { getSupabase } from '../middleware/auth'

const router = Router()

type FilterConfig = {
  field: 'status' | 'is_favorite'
  operator: 'is' | 'is_not' | 'includes'
  values: (string | boolean)[]
}

// Default views seeded the first time a user loads the tracker. Their
// filter_config mirrors the status groups the tracker has always used. "All"
// is permanent (no filter, cannot be deleted) and sits first.
const DEFAULT_VIEWS: {
  name: string
  is_permanent?: boolean
  filter_config: FilterConfig | null
}[] = [
  { name: 'All', is_permanent: true, filter_config: null },
  {
    name: 'Prospects',
    filter_config: { field: 'status', operator: 'is', values: ['prospect'] },
  },
  {
    name: 'Ready to apply',
    filter_config: {
      field: 'status',
      operator: 'is',
      values: ['ready_to_apply'],
    },
  },
  {
    name: 'Applied',
    filter_config: { field: 'status', operator: 'is', values: ['applied'] },
  },
  {
    name: 'In progress',
    filter_config: {
      field: 'status',
      operator: 'includes',
      values: [
        'pending_schedule',
        'interview_scheduled',
        'awaiting_response',
        'technical_test',
        'offer_received',
      ],
    },
  },
  {
    name: 'No openings',
    filter_config: { field: 'status', operator: 'is', values: ['no_openings'] },
  },
  {
    name: 'Rejected',
    filter_config: {
      field: 'status',
      operator: 'includes',
      values: ['rejected', 'rejected_ghosted'],
    },
  },
  {
    name: 'Favorites',
    filter_config: { field: 'is_favorite', operator: 'is', values: [true] },
  },
]

async function seedDefaultViews(userId: string) {
  const rows = DEFAULT_VIEWS.map((v, i) => ({
    user_id: userId,
    name: v.name,
    position: i,
    is_permanent: v.is_permanent ?? false,
    filter_config: v.filter_config,
    sort_config: null,
    hidden_columns: null,
  }))
  return await getSupabase().from('tracker_views').insert(rows).select('*')
}

router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('tracker_views')
    .select('*')
    .eq('user_id', req.userId!)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  if (!data || data.length === 0) {
    const { data: seeded, error: seedErr } = await seedDefaultViews(req.userId!)
    if (seedErr) return res.status(500).json({ error: seedErr.message })
    return res.json(seeded)
  }

  return res.json(data)
})

router.post('/', async (req, res) => {
  const { name, position, filter_config, sort_config, hidden_columns } =
    req.body

  if (typeof name !== 'string' || !name.trim())
    return res.status(400).json({ error: 'name is required' })

  // Default to the end of the list when no explicit position is given.
  let pos = position
  if (typeof pos !== 'number') {
    const { data: last } = await getSupabase()
      .from('tracker_views')
      .select('position')
      .eq('user_id', req.userId!)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    pos = (last?.position ?? -1) + 1
  }

  const { data, error } = await getSupabase()
    .from('tracker_views')
    .insert({
      user_id: req.userId!,
      name: name.trim(),
      position: pos,
      is_permanent: false,
      filter_config: filter_config ?? null,
      sort_config: sort_config ?? null,
      hidden_columns: hidden_columns ?? null,
    })
    .select('*')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { name, position, filter_config, sort_config, hidden_columns } =
    req.body

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (name !== undefined) update.name = name
  if (position !== undefined) update.position = position
  if (filter_config !== undefined) update.filter_config = filter_config
  if (sort_config !== undefined) update.sort_config = sort_config
  if (hidden_columns !== undefined) update.hidden_columns = hidden_columns

  const { data, error } = await getSupabase()
    .from('tracker_views')
    .update(update)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select('*')
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { data: target, error: fetchErr } = await getSupabase()
    .from('tracker_views')
    .select('id, is_permanent')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .maybeSingle()

  if (fetchErr) return res.status(500).json({ error: fetchErr.message })
  if (!target) return res.status(404).json({ error: 'Not found' })
  if (target.is_permanent)
    return res.status(400).json({ error: 'Cannot delete a permanent view' })

  const { error } = await getSupabase()
    .from('tracker_views')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ id: req.params.id })
})

export default router
