import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getSupabase } from '../../middleware/auth'
import { sendPlanLimit } from '../../billing/limits'
import { pdfToTiptap, PageLimitError } from '../../utils/pdfToTiptap'

const MAX_PAGES = 3
const MAX_COVER_LETTER_LABEL_LENGTH = 40

const router = Router()

function getDefaultLabel(): string {
  return 'Cover letter'
}

function getLabel(value: unknown): string {
  const label =
    typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : getDefaultLabel()
  return label.slice(0, MAX_COVER_LETTER_LABEL_LENGTH)
}

function getFileUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function isUserStoragePath(fileUrl: string, userId: string): boolean {
  return fileUrl.startsWith(`${userId}/`)
}

function createVariationKey(): string {
  return `variation-${randomUUID()}`
}

// Active templates only. Templates archived by a downgrade stay stored but are
// excluded from listing, counting, and compaction until the user resubscribes.
async function fetchCoverLetterTemplates(userId: string) {
  return getSupabase()
    .from('cover_letter_templates')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('position', { ascending: true })
}

async function compactCoverLetterPositions(userId: string) {
  const { data: remainingTemplates, error: fetchError } =
    await fetchCoverLetterTemplates(userId)

  if (fetchError) return { data: null, error: fetchError }

  for (const [index, template] of (remainingTemplates ?? []).entries()) {
    const nextPosition = index + 1
    if (template.position === nextPosition) continue

    const { error: updateError } = await getSupabase()
      .from('cover_letter_templates')
      .update({
        position: nextPosition,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', template.id)

    if (updateError) return { data: null, error: updateError }
  }

  return fetchCoverLetterTemplates(userId)
}

async function parseCoverLetterContent(
  fileUrl: string,
): Promise<
  | { ok: true; content: object | null }
  | { ok: false; status: number; error: string }
> {
  const supabase = getSupabase()
  let content: object | null = null

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from('cover-letters')
      .download(fileUrl)

    if (downloadError || !blob) {
      console.error(
        'Cover letter file download failed',
        downloadError ?? 'no blob returned',
      )
      return { ok: true, content }
    }

    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      content = await pdfToTiptap(buffer, { maxPages: MAX_PAGES })
    } catch (err) {
      if (err instanceof PageLimitError) {
        return {
          ok: false,
          status: 400,
          error: `PDF exceeds the ${MAX_PAGES}-page limit`,
        }
      }
      console.error('Cover letter PDF parse failed', err)
    }
  } catch (err) {
    console.error('Cover letter import failed', err)
  }

  return { ok: true, content }
}

// GET /api/cover-letters
router.get('/', async (req, res) => {
  const { data, error } = await fetchCoverLetterTemplates(req.userId!)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// POST /api/cover-letters
router.post('/', async (req, res) => {
  const fileUrl = getFileUrl(req.body.file_url)
  if (fileUrl && !isUserStoragePath(fileUrl, req.userId!)) {
    res.status(400).json({ error: 'file_url must belong to the current user' })
    return
  }

  const { data: templates, error: fetchError } =
    await fetchCoverLetterTemplates(req.userId!)

  if (fetchError) {
    res.status(500).json({ error: fetchError.message })
    return
  }

  const { plan, limits } = req.entitlement!
  const position = (templates?.length ?? 0) + 1
  if (position > limits.coverLetterVariations) {
    sendPlanLimit(
      res,
      'coverLetterVariations',
      limits.coverLetterVariations,
      plan,
    )
    return
  }

  // No file_url means an empty variation started from scratch in the editor.
  let content: object | null = null
  if (fileUrl) {
    const parsed = await parseCoverLetterContent(fileUrl)
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.error })
      return
    }
    content = parsed.content
  }

  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .insert({
      user_id: req.userId!,
      variation: createVariationKey(),
      position,
      label: getLabel(req.body.label),
      file_url: fileUrl,
      ...(content ? { content } : {}),
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

// PUT /api/cover-letters/:variation/file
router.put('/:variation/file', async (req, res) => {
  const fileUrl = getFileUrl(req.body.file_url)
  if (!fileUrl) {
    res.status(400).json({ error: 'file_url is required' })
    return
  }
  if (!isUserStoragePath(fileUrl, req.userId!)) {
    res.status(400).json({ error: 'file_url must belong to the current user' })
    return
  }

  const parsed = await parseCoverLetterContent(fileUrl)
  if (!parsed.ok) {
    res.status(parsed.status).json({ error: parsed.error })
    return
  }

  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .update({
      file_url: fileUrl,
      ...(parsed.content ? { content: parsed.content } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', req.userId!)
    .eq('variation', req.params.variation)
    .select()
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'cover letter variation not found' })
    return
  }

  res.json(data)
})

// PUT /api/cover-letters/:variation
router.put('/:variation', async (req, res) => {
  const hasContent = req.body.content !== undefined
  const hasLabel = req.body.label !== undefined

  if (!hasContent && !hasLabel) {
    res.status(400).json({ error: 'content or label is required' })
    return
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (hasContent) {
    if (!req.body.content) {
      res.status(400).json({ error: 'content is required' })
      return
    }
    updates.content = req.body.content
  }

  if (hasLabel) {
    const { label } = req.body
    if (typeof label !== 'string' || label.trim().length === 0) {
      res.status(400).json({ error: 'label is required' })
      return
    }
    updates.label = label.trim().slice(0, MAX_COVER_LETTER_LABEL_LENGTH)
  }

  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .update(updates)
    .eq('user_id', req.userId!)
    .eq('variation', req.params.variation)
    .select()
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'cover letter variation not found' })
    return
  }

  res.json(data)
})

// POST /api/cover-letters/:variation/restore
router.post('/:variation/restore', async (req, res) => {
  const supabase = getSupabase()

  const { data: template, error: fetchError } = await supabase
    .from('cover_letter_templates')
    .select('file_url')
    .eq('user_id', req.userId!)
    .eq('variation', req.params.variation)
    .maybeSingle()

  if (fetchError) {
    res.status(500).json({ error: fetchError.message })
    return
  }

  if (!template?.file_url) {
    res.status(404).json({ error: 'no original file found for this variation' })
    return
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from('cover-letters')
    .download(template.file_url)

  if (downloadError || !blob) {
    res.status(500).json({ error: downloadError?.message ?? 'download failed' })
    return
  }

  let content
  try {
    const buffer = Buffer.from(await blob.arrayBuffer())
    content = await pdfToTiptap(buffer)
  } catch (err) {
    console.error('Cover letter restore PDF parse failed', err)
    res.status(500).json({ error: 'PDF parse failed' })
    return
  }

  const { data, error: saveError } = await supabase
    .from('cover_letter_templates')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('user_id', req.userId!)
    .eq('variation', req.params.variation)
    .select()
    .single()

  if (saveError) {
    res.status(500).json({ error: saveError.message })
    return
  }

  res.json(data)
})

// DELETE /api/cover-letters/:variation
router.delete('/:variation', async (req, res) => {
  const { error } = await getSupabase()
    .from('cover_letter_templates')
    .delete()
    .eq('user_id', req.userId!)
    .eq('variation', req.params.variation)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const { data: compactedTemplates, error: compactedFetchError } =
    await compactCoverLetterPositions(req.userId!)

  if (compactedFetchError) {
    res.status(500).json({ error: compactedFetchError.message })
    return
  }

  res.json(compactedTemplates ?? [])
})

export default router
