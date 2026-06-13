import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../middleware/auth', () => ({ getSupabase: vi.fn() }))

import * as authModule from '../middleware/auth'
import { archiveOverflow, unarchiveAll, applyPlanTransition } from './archive'

const mockGetSupabase = vi.mocked(authModule.getSupabase)

type Row = { id: string }

// Configurable Supabase mock that records the archive/unarchive writes each
// resource performs, so tests can assert which rows were frozen/restored.
function mockSupabase(activeIdsByTable: Record<string, Row[]> = {}) {
  const archived: { table: string; ids: string[]; archived_at: unknown }[] = []
  const unarchived: { table: string; archived_at: unknown }[] = []

  const from = vi.fn((table: string) => ({
    // archive: select active ids in canonical order
    select: () => ({
      eq: () => ({
        is: () => ({
          order: () =>
            Promise.resolve({
              data: activeIdsByTable[table] ?? [],
              error: null,
            }),
        }),
      }),
    }),
    update: (payload: { archived_at: unknown }) => ({
      eq: () => ({
        // archive: stamp archived_at on the overflow ids
        in: (_col: string, ids: string[]) => {
          archived.push({ table, ids, archived_at: payload.archived_at })
          return Promise.resolve({ error: null })
        },
        // unarchive: clear archived_at on every previously-archived row
        not: () => {
          unarchived.push({ table, archived_at: payload.archived_at })
          return Promise.resolve({ error: null })
        },
      }),
    }),
  }))

  mockGetSupabase.mockReturnValue({ from } as never)
  return { from, archived, unarchived }
}

beforeEach(() => vi.clearAllMocks())

describe('archiveOverflow', () => {
  it('archives only the rows past a resource’s Free allowance', async () => {
    const tokenIds = ['t1', 't2', 't3', 't4', 't5'].map((id) => ({ id }))
    const { archived } = mockSupabase({ cover_letter_tokens: tokenIds })

    await archiveOverflow('u1')

    // Free keeps 4 token definitions → t5 is frozen.
    const tokens = archived.find((a) => a.table === 'cover_letter_tokens')
    expect(tokens?.ids).toEqual(['t5'])
    expect(tokens?.archived_at).toEqual(expect.any(String))
  })

  it('no-ops a resource already at or under its Free limit', async () => {
    // Free keeps 4 answers; exactly 4 active → nothing to archive.
    const { archived } = mockSupabase({
      answers: ['a1', 'a2', 'a3', 'a4'].map((id) => ({ id })),
    })

    await archiveOverflow('u1')

    expect(archived.find((a) => a.table === 'answers')).toBeUndefined()
  })
})

describe('unarchiveAll', () => {
  it('clears archived_at across every capped resource', async () => {
    const { unarchived } = mockSupabase()

    await unarchiveAll('u1')

    expect(unarchived.map((u) => u.table).sort()).toEqual([
      'answers',
      'applications',
      'cover_letter_templates',
      'cover_letter_tokens',
      'resume_variations',
    ])
    expect(unarchived.every((u) => u.archived_at === null)).toBe(true)
  })
})

describe('applyPlanTransition', () => {
  it('archives overflow on a Pro→Free downgrade', async () => {
    const { archived, unarchived } = mockSupabase({
      cover_letter_tokens: ['t1', 't2', 't3', 't4', 't5'].map((id) => ({
        id,
      })),
    })

    await applyPlanTransition('u1', true, false)

    expect(
      archived.find((a) => a.table === 'cover_letter_tokens')?.ids,
    ).toEqual(['t5'])
    expect(unarchived).toHaveLength(0)
  })

  it('restores everything on a Free→Pro resubscribe', async () => {
    const { archived, unarchived } = mockSupabase()

    await applyPlanTransition('u1', false, true)

    expect(unarchived.length).toBe(5)
    expect(archived).toHaveLength(0)
  })

  it('does nothing when entitlement did not cross the boundary', async () => {
    const { from } = mockSupabase()

    await applyPlanTransition('u1', true, true)
    await applyPlanTransition('u1', false, false)

    expect(from).not.toHaveBeenCalled()
  })
})
