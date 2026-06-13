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

// `active` = rows the plan currently exposes (archived_at IS NULL); `archived` =
// rows frozen by a downgrade and restored on resubscribe.
export interface UsageBreakdown {
  active: UsageCounts
  archived: UsageCounts
}

const RESOURCE_TABLES: { key: keyof UsageCounts; table: string }[] = [
  { key: 'applications', table: 'applications' },
  { key: 'answers', table: 'answers' },
  { key: 'resumeVariations', table: 'resume_variations' },
  { key: 'coverLetterVariations', table: 'cover_letter_templates' },
  { key: 'tokenDefinitions', table: 'cover_letter_tokens' },
]

async function countRows(
  table: string,
  userId: string,
  archived: boolean,
): Promise<number> {
  const base = getSupabase()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const { count } = await (archived
    ? base.not('archived_at', 'is', null)
    : base.is('archived_at', null))
  return count ?? 0
}

export async function getUsageBreakdown(
  userId: string,
): Promise<UsageBreakdown> {
  const active = {} as UsageCounts
  const archived = {} as UsageCounts

  await Promise.all(
    RESOURCE_TABLES.flatMap(({ key, table }) => [
      countRows(table, userId, false).then((n) => {
        active[key] = n
      }),
      countRows(table, userId, true).then((n) => {
        archived[key] = n
      }),
    ]),
  )

  return { active, archived }
}
