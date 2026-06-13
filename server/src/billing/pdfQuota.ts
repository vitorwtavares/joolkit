import { getSupabase } from '../middleware/auth'

export interface PdfExportUsage {
  limit: number
  used: number
  remaining: number
  // When the daily window resets (ISO), or null if no exports have been used in
  // the current window.
  resetAt: string | null
}

// Reads — without consuming — the daily PDF-export rate-limit row so the client
// can show how many exports remain today. Mirrors the key the export limiter
// consumes (`pdf-export:<userId>`); an expired window counts as zero used.
export async function getPdfExportUsage(
  userId: string,
  limit: number,
): Promise<PdfExportUsage> {
  const { data } = await getSupabase()
    .from('api_rate_limits')
    .select('count, reset_at')
    .eq('key', `pdf-export:${userId}`)
    .maybeSingle<{ count: number; reset_at: string }>()

  const active = !!data && new Date(data.reset_at).getTime() > Date.now()
  const used = active ? data!.count : 0
  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    resetAt: active ? data!.reset_at : null,
  }
}
