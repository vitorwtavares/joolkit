import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'
import { normalizeTokenKey } from '../../utils/tiptapToHtml'

const router = Router()

type CoverLetterTokenPayload = {
  key: string
  value?: string | null
}

function getCoverLetterTokenPayload(value: unknown): CoverLetterTokenPayload[] {
  const rows =
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { tokens?: unknown }).tokens)
      ? (value as { tokens: unknown[] }).tokens
      : []
  const byKey = new Map<string, string>()

  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue
    const key = normalizeTokenKey(String((row as { key?: unknown }).key ?? ''))
    if (!key || byKey.has(key)) continue
    const rawValue = (row as { value?: unknown }).value
    byKey.set(key, typeof rawValue === 'string' ? rawValue : '')
  }

  return [...byKey.entries()].map(([key, tokenValue]) => ({
    key,
    value: tokenValue,
  }))
}

function mapCoverLetterToken(row: {
  id: string
  user_id: string
  token_key: string
  token_value: string | null
  position: number
  created_at?: string
  updated_at: string
}) {
  return {
    id: row.id,
    user_id: row.user_id,
    key: row.token_key,
    value: row.token_value ?? '',
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function formatTokenKeysForInFilter(keys: string[]): string {
  return `(${keys.map((key) => `"${key.replace(/"/g, '\\"')}"`).join(',')})`
}

// GET /api/cover-letters/tokens
router.get('/', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('cover_letter_tokens')
    .select(
      'id, user_id, token_key, token_value, position, created_at, updated_at',
    )
    .eq('user_id', req.userId!)
    .order('position', { ascending: true })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json((data ?? []).map(mapCoverLetterToken))
})

// PUT /api/cover-letters/tokens
router.put('/', async (req, res) => {
  const tokens = getCoverLetterTokenPayload(req.body)
  const now = new Date().toISOString()
  const userId = req.userId!
  const supabase = getSupabase()

  if (tokens.length === 0) {
    const { error: deleteError } = await supabase
      .from('cover_letter_tokens')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      res.status(500).json({ error: deleteError.message })
      return
    }

    res.json([])
    return
  }

  const rows = tokens.map((token, index) => ({
    user_id: userId,
    token_key: token.key,
    token_value: token.value ?? '',
    position: index + 1,
    updated_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('cover_letter_tokens')
    .upsert(rows, { onConflict: 'user_id,token_key' })

  if (upsertError) {
    res.status(500).json({ error: upsertError.message })
    return
  }

  const incomingKeys = tokens.map((token) => token.key)
  const { error: deleteOrphansError } = await supabase
    .from('cover_letter_tokens')
    .delete()
    .eq('user_id', userId)
    .not('token_key', 'in', formatTokenKeysForInFilter(incomingKeys))

  if (deleteOrphansError) {
    res.status(500).json({ error: deleteOrphansError.message })
    return
  }

  const { data, error: fetchError } = await supabase
    .from('cover_letter_tokens')
    .select(
      'id, user_id, token_key, token_value, position, created_at, updated_at',
    )
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (fetchError) {
    res.status(500).json({ error: fetchError.message })
    return
  }

  res.json((data ?? []).map(mapCoverLetterToken))
})

export default router
