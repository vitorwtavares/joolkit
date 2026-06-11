import { getSupabase } from '../middleware/auth'
import { PLAN_LIMITS } from './plans'

// Resources whose Free visibility is enforced by archiving over-limit rows on
// downgrade. `orderColumn`/`ascending` give each resource's canonical order; the
// first `keep` rows in that order stay active and the rest are archived. A null
// keep (unlimited) archives nothing.
const ARCHIVABLE: {
  table: string
  orderColumn: string
  ascending: boolean
  keep: number | null
}[] = [
  {
    table: 'applications',
    orderColumn: 'created_at',
    ascending: false,
    keep: PLAN_LIMITS.free.applications,
  },
  {
    table: 'answers',
    orderColumn: 'position',
    ascending: true,
    keep: PLAN_LIMITS.free.answers,
  },
  {
    table: 'resume_variations',
    orderColumn: 'position',
    ascending: true,
    keep: PLAN_LIMITS.free.resumeVariations,
  },
  {
    table: 'cover_letter_templates',
    orderColumn: 'position',
    ascending: true,
    keep: PLAN_LIMITS.free.coverLetterVariations,
  },
  {
    table: 'cover_letter_tokens',
    orderColumn: 'position',
    ascending: true,
    keep: PLAN_LIMITS.free.tokenDefinitions,
  },
]

async function archiveResourceOverflow(
  userId: string,
  table: string,
  orderColumn: string,
  ascending: boolean,
  keep: number | null,
): Promise<void> {
  const { data, error } = await getSupabase()
    .from(table)
    .select('id')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order(orderColumn, { ascending })
  if (error) throw new Error(error.message)

  // Infinity keeps everything (unlimited tiers archive nothing).
  const overflowIds = (data ?? []).slice(keep ?? Infinity).map((row) => row.id)
  if (overflowIds.length === 0) return

  const { error: updateError } = await getSupabase()
    .from(table)
    .update({ archived_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', overflowIds)
  if (updateError) throw new Error(updateError.message)
}

// Pro→Free: keep each resource's Free allowance active, freeze the overflow.
// Idempotent — re-running never archives more than the overflow.
export async function archiveOverflow(userId: string): Promise<void> {
  for (const r of ARCHIVABLE) {
    await archiveResourceOverflow(
      userId,
      r.table,
      r.orderColumn,
      r.ascending,
      r.keep,
    )
  }
}

// Free→Pro: restore everything the user had before the downgrade.
export async function unarchiveAll(userId: string): Promise<void> {
  for (const r of ARCHIVABLE) {
    const { error } = await getSupabase()
      .from(r.table)
      .update({ archived_at: null })
      .eq('user_id', userId)
      .not('archived_at', 'is', null)
    if (error) throw new Error(error.message)
  }
}

// Applies the archive side effects of a plan change. No-op unless entitlement
// actually crossed the Pro/Free boundary.
export async function applyPlanTransition(
  userId: string,
  wasPro: boolean,
  isPro: boolean,
): Promise<void> {
  if (wasPro && !isPro) await archiveOverflow(userId)
  else if (!wasPro && isPro) await unarchiveAll(userId)
}
