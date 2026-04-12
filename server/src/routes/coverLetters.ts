import { Router } from 'express'
import pdfParse from 'pdf-parse'
import { getSupabase, AuthRequest } from '../middleware/auth'

function textToTiptapDoc(text: string): object {
  const paragraphs = text
    .split(/\n/)
    .map((line) => line.trimEnd())
    .map((line) => ({
      type: 'paragraph',
      ...(line.length > 0 ? { content: [{ type: 'text', text: line }] } : {}),
    }))

  // Trim leading/trailing empty paragraphs
  let start = 0
  let end = paragraphs.length - 1
  while (start <= end && !('content' in paragraphs[start])) start++
  while (end >= start && !('content' in paragraphs[end])) end--

  return { type: 'doc', content: paragraphs.slice(start, end + 1) }
}

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
    .upsert(
      {
        user_id: req.userId!,
        role,
        company,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
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
    .upsert(
      {
        user_id: req.userId!,
        variation,
        file_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,variation' },
    )
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// PUT /api/cover-letters/:variation
router.put('/:variation', async (req: AuthRequest, res) => {
  const { variation } = req.params
  if (variation !== 'formal' && variation !== 'light') {
    res.status(400).json({ error: 'variation must be formal or light' })
    return
  }

  const { content } = req.body
  if (!content) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  const { data, error } = await getSupabase()
    .from('cover_letter_templates')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('user_id', req.userId!)
    .eq('variation', variation)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// POST /api/cover-letters/:variation/restore
router.post('/:variation/restore', async (req: AuthRequest, res) => {
  const { variation } = req.params
  if (variation !== 'formal' && variation !== 'light') {
    res.status(400).json({ error: 'variation must be formal or light' })
    return
  }

  const supabase = getSupabase()

  const { data: template, error: fetchError } = await supabase
    .from('cover_letter_templates')
    .select('file_url')
    .eq('user_id', req.userId!)
    .eq('variation', variation)
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

  const buffer = Buffer.from(await blob.arrayBuffer())
  const parsed = await pdfParse(buffer)
  const content = textToTiptapDoc(parsed.text)

  const { data, error: saveError } = await supabase
    .from('cover_letter_templates')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('user_id', req.userId!)
    .eq('variation', variation)
    .select()
    .single()

  if (saveError) {
    res.status(500).json({ error: saveError.message })
    return
  }

  res.json(data)
})

// DELETE /api/cover-letters/:variation
router.delete('/:variation', async (req: AuthRequest, res) => {
  const { variation } = req.params
  if (variation !== 'formal' && variation !== 'light') {
    res.status(400).json({ error: 'variation must be formal or light' })
    return
  }

  const { error } = await getSupabase()
    .from('cover_letter_templates')
    .delete()
    .eq('user_id', req.userId!)
    .eq('variation', variation)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).send()
})

export default router
