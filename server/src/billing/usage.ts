import { getSupabase } from '../middleware/auth'

// Stored-row counts per capped resource. PDF exports aren't included — that's a
// daily rate tracked in api_rate_limits, not a stored total.
export interface UsageCounts {
  applications: number
  answers: number
  resumeVariations: number
  coverLetterVariations: number
  tokenDefinitions: number
}

async function countRows(table: string, userId: string): Promise<number> {
  const { count } = await getSupabase()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function getUsageCounts(userId: string): Promise<UsageCounts> {
  const [
    applications,
    answers,
    resumeVariations,
    coverLetterVariations,
    tokenDefinitions,
  ] = await Promise.all([
    countRows('applications', userId),
    countRows('answers', userId),
    countRows('resume_variations', userId),
    countRows('cover_letter_templates', userId),
    countRows('cover_letter_tokens', userId),
  ])

  return {
    applications,
    answers,
    resumeVariations,
    coverLetterVariations,
    tokenDefinitions,
  }
}
