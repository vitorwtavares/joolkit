import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import {
  createSelectBuilder,
  createInsertBuilder,
  createUpdateBuilder,
  createCompactUpdateBuilder,
  createDeleteBuilder,
} from '../../test/test-utils/supabase-mock-builders'

vi.mock('../../utils/pdfToTiptap', () => ({
  PageLimitError: class PageLimitError extends Error {},
  pdfToTiptap: vi.fn().mockResolvedValue({ type: 'doc', content: [] }),
}))

vi.mock('../../middleware/auth', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../middleware/auth')>()
  return {
    ...original,
    getSupabase: vi.fn(),
    authMiddleware: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.userId = 'test-user-id'
      next()
    },
  }
})

import * as authModule from '../../middleware/auth'
import coverLettersRouter from '.'
import { PLAN_LIMITS, type Plan } from '../../billing/plans'

const USER_ID = 'test-user-id'

interface CoverLetterRow {
  id: string
  user_id: string
  variation: string
  position: number
  label: string
  file_url: string | null
}

function coverLetter(overrides: Partial<CoverLetterRow> = {}): CoverLetterRow {
  const position = overrides.position ?? 1
  return {
    id: String(position),
    user_id: USER_ID,
    variation: `variation-${position}`,
    position,
    label: `Cover letter ${position}`,
    file_url: `${USER_ID}/${position}/cover-letter.pdf`,
    ...overrides,
  }
}

function buildApp(plan: Plan = 'pro') {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use((req, _res, next) => {
    req.entitlement = { plan, limits: PLAN_LIMITS[plan], subscription: null }
    next()
  })
  app.use('/api/cover-letters', coverLettersRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function createUpsertBuilder(response: { error: unknown }) {
  const mockUpsert = vi.fn().mockResolvedValue(response)
  return { builder: { upsert: mockUpsert }, mockUpsert }
}

// Orphan deletion is scoped to active rows: `.delete().eq().is().not()`.
function createOrphanDeleteBuilder(response: { error: unknown }) {
  const mockNot = vi.fn().mockResolvedValue(response)
  const mockIs = vi.fn().mockReturnValue({ not: mockNot })
  const mockEq = vi.fn().mockReturnValue({ is: mockIs })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
  return {
    builder: { delete: mockDelete },
    mockDelete,
    mockEq,
    mockIs,
    mockNot,
  }
}

function createStorage() {
  return {
    from: vi.fn().mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: {
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        },
        error: null,
      }),
    }),
  }
}

describe('cover letter token routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user-defined tokens ordered by position', async () => {
    const select = createSelectBuilder({
      data: [
        {
          id: 'token-1',
          user_id: USER_ID,
          token_key: 'company',
          token_value: 'Joolkit',
          position: 1,
          created_at: '2026-06-07T00:00:00.000Z',
          updated_at: '2026-06-07T00:00:00.000Z',
        },
      ],
      error: null,
    })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(select.builder),
    } as never)

    const res = await request(buildApp()).get('/api/cover-letters/tokens')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      {
        id: 'token-1',
        user_id: USER_ID,
        key: 'company',
        value: 'Joolkit',
        position: 1,
        created_at: '2026-06-07T00:00:00.000Z',
        updated_at: '2026-06-07T00:00:00.000Z',
      },
    ])
    expect(select.mockEq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(select.mockOrder).toHaveBeenCalledWith('position', {
      ascending: true,
    })
  })

  it('replaces tokens with normalized key-value rows', async () => {
    const upsert = createUpsertBuilder({ error: null })
    const orphanDelete = createOrphanDeleteBuilder({ error: null })
    const select = createSelectBuilder({
      data: [
        {
          id: 'token-1',
          user_id: USER_ID,
          token_key: 'hiring-manager',
          token_value: 'Jane',
          position: 1,
          created_at: '2026-06-07T00:00:00.000Z',
          updated_at: '2026-06-07T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(upsert.builder)
      .mockReturnValueOnce(orphanDelete.builder)
      .mockReturnValueOnce(select.builder)
    mockGetSupabase.mockReturnValue({ from: mockFrom } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/tokens')
      .send({
        tokens: [
          { key: 'Hiring Manager', value: 'Jane' },
          { key: '', value: 'ignored' },
        ],
      })

    expect(res.status).toBe(200)
    expect(upsert.mockUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          user_id: USER_ID,
          token_key: 'hiring-manager',
          token_value: 'Jane',
          position: 1,
        }),
      ],
      { onConflict: 'user_id,token_key' },
    )
    expect(orphanDelete.mockEq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(orphanDelete.mockNot).toHaveBeenCalledWith(
      'token_key',
      'in',
      '("hiring-manager")',
    )
    expect(res.body).toEqual([
      {
        id: 'token-1',
        user_id: USER_ID,
        key: 'hiring-manager',
        value: 'Jane',
        position: 1,
        created_at: '2026-06-07T00:00:00.000Z',
        updated_at: '2026-06-07T00:00:00.000Z',
      },
    ])
  })

  it('keeps the first value when duplicate keys are sent in one payload', async () => {
    const upsert = createUpsertBuilder({ error: null })
    const orphanDelete = createOrphanDeleteBuilder({ error: null })
    const select = createSelectBuilder({
      data: [
        {
          id: 'token-1',
          user_id: USER_ID,
          token_key: 'role',
          token_value: 'Engineer',
          position: 1,
          created_at: '2026-06-07T00:00:00.000Z',
          updated_at: '2026-06-07T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(upsert.builder)
      .mockReturnValueOnce(orphanDelete.builder)
      .mockReturnValueOnce(select.builder)
    mockGetSupabase.mockReturnValue({ from: mockFrom } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/tokens')
      .send({
        tokens: [
          { key: 'role', value: 'Engineer' },
          { key: 'role', value: '' },
        ],
      })

    expect(res.status).toBe(200)
    expect(upsert.mockUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          token_key: 'role',
          token_value: 'Engineer',
        }),
      ],
      { onConflict: 'user_id,token_key' },
    )
  })

  it('blocks a Free user from defining more than 4 token definitions', async () => {
    const res = await request(buildApp('free'))
      .put('/api/cover-letters/tokens')
      .send({
        tokens: [
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
          { key: 'c', value: '3' },
          { key: 'd', value: '4' },
          { key: 'e', value: '5' },
        ],
      })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      code: 'plan_limit',
      resource: 'tokenDefinitions',
      plan: 'free',
      limit: 4,
    })
  })

  it('scopes Free orphan deletion to active rows so archived tokens survive', async () => {
    const upsert = createUpsertBuilder({ error: null })
    const orphanDelete = createOrphanDeleteBuilder({ error: null })
    const select = createSelectBuilder({ data: [], error: null })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(upsert.builder)
      .mockReturnValueOnce(orphanDelete.builder)
      .mockReturnValueOnce(select.builder)
    mockGetSupabase.mockReturnValue({ from: mockFrom } as never)

    const res = await request(buildApp('free'))
      .put('/api/cover-letters/tokens')
      .send({
        tokens: [
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
        ],
      })

    expect(res.status).toBe(200)
    // Orphan deletion only touches active rows; archived (downgrade) tokens stay.
    expect(orphanDelete.mockIs).toHaveBeenCalledWith('archived_at', null)
    // The returned set is the active window too.
    expect(select.mockIs).toHaveBeenCalledWith('archived_at', null)
  })
})

describe('POST /api/cover-letters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an empty variation when no file_url is provided', async () => {
    const existingSelect = createSelectBuilder({ data: [], error: null })
    const insert = createInsertBuilder({
      data: { ...coverLetter({ position: 1 }), file_url: null },
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(existingSelect.builder)
      .mockReturnValueOnce(insert.builder)
    mockGetSupabase.mockReturnValue({
      from: mockFrom,
      storage: createStorage(),
    } as never)

    const res = await request(buildApp()).post('/api/cover-letters').send({})

    expect(res.status).toBe(200)
    const insertPayload = insert.mockInsert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      user_id: USER_ID,
      position: 1,
      file_url: null,
    })
    expect(insertPayload).not.toHaveProperty('content')
    expect(insertPayload.variation).toMatch(/^variation-/)
  })

  it('returns 400 when file_url is outside the current user folder', async () => {
    const res = await request(buildApp())
      .post('/api/cover-letters')
      .send({ file_url: 'other-user/cover-letter.pdf' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: 'file_url must belong to the current user',
    })
  })

  it('creates a cover letter variation at the next position', async () => {
    const existingSelect = createSelectBuilder({
      data: [coverLetter({ position: 1 })],
      error: null,
    })
    const insert = createInsertBuilder({
      data: coverLetter({
        position: 2,
        label: 'Warm',
        file_url: `${USER_ID}/cover-letter.pdf`,
      }),
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(existingSelect.builder)
      .mockReturnValueOnce(insert.builder)
    mockGetSupabase.mockReturnValue({
      from: mockFrom,
      storage: createStorage(),
    } as never)

    const res = await request(buildApp())
      .post('/api/cover-letters')
      .send({
        label: 'Warm',
        file_url: `${USER_ID}/cover-letter.pdf`,
      })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('cover_letter_templates')
    const insertPayload = insert.mockInsert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      user_id: USER_ID,
      position: 2,
      label: 'Warm',
      file_url: `${USER_ID}/cover-letter.pdf`,
    })
    expect(insertPayload.variation).toMatch(/^variation-/)
    expect(insertPayload).toHaveProperty('updated_at')
  })

  it('caps cover letter labels at 40 characters on create', async () => {
    const existingSelect = createSelectBuilder({ data: [], error: null })
    const insert = createInsertBuilder({
      data: coverLetter({
        label: 'Senior front-end engineering manager rol',
        file_url: `${USER_ID}/cover-letter.pdf`,
      }),
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(existingSelect.builder)
      .mockReturnValueOnce(insert.builder)
    mockGetSupabase.mockReturnValue({
      from: mockFrom,
      storage: createStorage(),
    } as never)

    const res = await request(buildApp())
      .post('/api/cover-letters')
      .send({
        label: 'Senior front-end engineering manager role plus extra',
        file_url: `${USER_ID}/cover-letter.pdf`,
      })

    expect(res.status).toBe(200)
    expect(insert.mockInsert.mock.calls[0][0]).toMatchObject({
      label: 'Senior front-end engineering manager rol',
    })
  })

  it('blocks creation with a plan_limit error when the Pro cap is reached', async () => {
    const existingSelect = createSelectBuilder({
      data: Array.from({ length: 10 }, (_, index) =>
        coverLetter({ position: index + 1 }),
      ),
      error: null,
    })
    const mockFrom = vi.fn().mockReturnValue(existingSelect.builder)
    mockGetSupabase.mockReturnValue({
      from: mockFrom,
      storage: createStorage(),
    } as never)

    const res = await request(buildApp('pro'))
      .post('/api/cover-letters')
      .send({
        file_url: `${USER_ID}/cover-letter.pdf`,
      })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      code: 'plan_limit',
      resource: 'coverLetterVariations',
      plan: 'pro',
      limit: 10,
    })
  })

  it('blocks a Free user after the single allowed variation', async () => {
    const existingSelect = createSelectBuilder({
      data: [coverLetter({ position: 1 })],
      error: null,
    })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(existingSelect.builder),
      storage: createStorage(),
    } as never)

    const res = await request(buildApp('free'))
      .post('/api/cover-letters')
      .send({ file_url: `${USER_ID}/cover-letter.pdf` })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      code: 'plan_limit',
      resource: 'coverLetterVariations',
      plan: 'free',
      limit: 1,
    })
  })
})

describe('PUT /api/cover-letters/:variation/file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when file_url is missing', async () => {
    const res = await request(buildApp())
      .put('/api/cover-letters/formal/file')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'file_url is required' })
  })

  it('updates an existing cover letter file', async () => {
    const update = createUpdateBuilder({
      data: coverLetter({
        variation: 'formal',
        file_url: `${USER_ID}/formal/cover-letter.pdf`,
      }),
      error: null,
    })
    const mockFrom = vi.fn().mockReturnValue(update.builder)
    mockGetSupabase.mockReturnValue({
      from: mockFrom,
      storage: createStorage(),
    } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/formal/file')
      .send({ file_url: `${USER_ID}/formal/cover-letter.pdf` })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('cover_letter_templates')
    expect(update.mockUpdate.mock.calls[0][0]).toMatchObject({
      file_url: `${USER_ID}/formal/cover-letter.pdf`,
    })
    expect(update.mockEq1).toHaveBeenCalledWith('user_id', USER_ID)
    expect(update.mockEq2).toHaveBeenCalledWith('variation', 'formal')
  })

  it('returns 404 when no cover letter variation matches', async () => {
    const update = createUpdateBuilder({ data: null, error: null })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(update.builder),
      storage: createStorage(),
    } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/missing/file')
      .send({ file_url: `${USER_ID}/missing/cover-letter.pdf` })

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'cover letter variation not found' })
  })
})

describe('PUT /api/cover-letters/:variation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a cover letter label', async () => {
    const update = createUpdateBuilder({
      data: coverLetter({ variation: 'formal', label: 'Formal' }),
      error: null,
    })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(update.builder),
    } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/formal')
      .send({ label: '  Formal  ' })

    expect(res.status).toBe(200)
    expect(update.mockUpdate.mock.calls[0][0]).toMatchObject({
      label: 'Formal',
    })
    expect(update.mockUpdate.mock.calls[0][0]).toHaveProperty('updated_at')
  })

  it('caps cover letter labels at 40 characters on update', async () => {
    const update = createUpdateBuilder({
      data: coverLetter({
        variation: 'formal',
        label: 'Senior front-end engineering manager rol',
      }),
      error: null,
    })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(update.builder),
    } as never)

    const res = await request(buildApp())
      .put('/api/cover-letters/formal')
      .send({ label: 'Senior front-end engineering manager role plus extra' })

    expect(res.status).toBe(200)
    expect(update.mockUpdate.mock.calls[0][0]).toMatchObject({
      label: 'Senior front-end engineering manager rol',
    })
  })
})

describe('DELETE /api/cover-letters/:variation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the selected cover letter variation and compacts positions', async () => {
    const [first, third] = [1, 3].map((position) => coverLetter({ position }))
    const compactedThird = { ...third, position: 2 }
    const deleteBuilder = createDeleteBuilder({ error: null })
    const remainingSelect = createSelectBuilder({
      data: [first, third],
      error: null,
    })
    const compactUpdate = createCompactUpdateBuilder({ error: null })
    const compactedSelect = createSelectBuilder({
      data: [first, compactedThird],
      error: null,
    })
    const mockFrom = vi
      .fn()
      .mockReturnValueOnce(deleteBuilder.builder)
      .mockReturnValueOnce(remainingSelect.builder)
      .mockReturnValueOnce(compactUpdate.builder)
      .mockReturnValueOnce(compactedSelect.builder)
    mockGetSupabase.mockReturnValue({ from: mockFrom } as never)

    const res = await request(buildApp()).delete(
      '/api/cover-letters/variation-2',
    )

    expect(res.status).toBe(200)
    expect(res.body).toEqual([first, compactedThird])
    expect(deleteBuilder.mockEq1).toHaveBeenCalledWith('user_id', USER_ID)
    expect(deleteBuilder.mockEq2).toHaveBeenCalledWith(
      'variation',
      'variation-2',
    )
    expect(compactUpdate.mockUpdate.mock.calls[0][0]).toMatchObject({
      position: 2,
    })
    expect(compactUpdate.mockEq2).toHaveBeenCalledWith('id', '3')
  })

  it('returns 500 when Supabase returns an error', async () => {
    const deleteBuilder = createDeleteBuilder({
      error: { message: 'delete failed' },
    })
    mockGetSupabase.mockReturnValue({
      from: vi.fn().mockReturnValue(deleteBuilder.builder),
    } as never)

    const res = await request(buildApp()).delete('/api/cover-letters/light')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'delete failed' })
  })
})
