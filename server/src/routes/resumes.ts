import { Router } from 'express'
import { getSupabase } from '../middleware/auth'

const MAX_RESUME_VARIATIONS = 10

const router = Router()

function getDefaultLabel(): string {
  return 'Resume'
}

function getLabel(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : getDefaultLabel()
}

function getFileUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

async function fetchResumeVariations(userId: string) {
  return getSupabase()
    .from('resume_variations')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
}

async function compactResumePositions(userId: string) {
  const { data: remainingResumes, error: fetchError } =
    await fetchResumeVariations(userId)

  if (fetchError) return { data: null, error: fetchError }

  for (const [index, resume] of (remainingResumes ?? []).entries()) {
    const nextPosition = index + 1
    if (resume.position === nextPosition) continue

    const { error: updateError } = await getSupabase()
      .from('resume_variations')
      .update({
        position: nextPosition,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', resume.id)

    if (updateError) return { data: null, error: updateError }
  }

  return fetchResumeVariations(userId)
}

// GET /api/resumes
router.get('/', async (req, res) => {
  const { data, error } = await fetchResumeVariations(req.userId!)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// POST /api/resumes
router.post('/', async (req, res) => {
  const fileUrl = getFileUrl(req.body.file_url)
  if (!fileUrl) {
    res.status(400).json({ error: 'file_url is required' })
    return
  }

  const { data: resumes, error: fetchError } = await fetchResumeVariations(
    req.userId!,
  )

  if (fetchError) {
    res.status(500).json({ error: fetchError.message })
    return
  }

  const position = (resumes?.length ?? 0) + 1
  if (position > MAX_RESUME_VARIATIONS) {
    res.status(400).json({ error: 'maximum resume variations reached' })
    return
  }

  const { data, error } = await getSupabase()
    .from('resume_variations')
    .insert({
      user_id: req.userId!,
      position,
      label: getLabel(req.body.label),
      file_url: fileUrl,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// PUT /api/resumes/:id/file
router.put('/:id/file', async (req, res) => {
  const fileUrl = getFileUrl(req.body.file_url)
  if (!fileUrl) {
    res.status(400).json({ error: 'file_url is required' })
    return
  }

  const { data, error } = await getSupabase()
    .from('resume_variations')
    .update({
      file_url: fileUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', req.userId!)
    .eq('id', req.params.id)
    .select()
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'resume variation not found' })
    return
  }

  res.json(data)
})

// PUT /api/resumes/:id
router.put('/:id', async (req, res) => {
  const { label } = req.body
  if (typeof label !== 'string' || label.trim().length === 0) {
    res.status(400).json({ error: 'label is required' })
    return
  }

  const { data, error } = await getSupabase()
    .from('resume_variations')
    .update({
      label: label.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', req.userId!)
    .eq('id', req.params.id)
    .select()
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'resume variation not found' })
    return
  }

  res.json(data)
})

// DELETE /api/resumes/:id
router.delete('/:id', async (req, res) => {
  const { error } = await getSupabase()
    .from('resume_variations')
    .delete()
    .eq('user_id', req.userId!)
    .eq('id', req.params.id)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const { data: compactedResumes, error: compactedFetchError } =
    await compactResumePositions(req.userId!)

  if (compactedFetchError) {
    res.status(500).json({ error: compactedFetchError.message })
    return
  }

  res.json(compactedResumes ?? [])
})

export default router
