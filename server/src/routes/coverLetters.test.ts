import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../utils/pdfToTiptap', () => ({
  PageLimitError: class PageLimitError extends Error {},
  pdfToTiptap: vi.fn().mockResolvedValue({ type: 'doc', content: [] }),
}))

vi.mock('../middleware/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/auth')>()
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

import * as authModule from '../middleware/auth'
import coverLettersRouter from './coverLetters'

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

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/cover-letters', coverLettersRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function createSelectBuilder(response: { data: unknown; error: unknown }) {
  const mockOrder = vi.fn().mockResolvedValue(response)
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { builder: { select: mockSelect }, mockEq, mockOrder }
}

function createInsertBuilder(response: { data: unknown; error: unknown }) {
  const mockSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  return { builder: { insert: mockInsert }, mockInsert }
}

function createUpdateBuilder(response: { data: unknown; error: unknown }) {
  const mockMaybeSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect })
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { update: mockUpdate }, mockUpdate, mockEq1, mockEq2 }
}

function createCompactUpdateBuilder(response: { error: unknown }) {
  const mockEq2 = vi.fn().mockResolvedValue(response)
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { update: mockUpdate }, mockUpdate, mockEq1, mockEq2 }
}

function createDeleteBuilder(response: { error: unknown }) {
  const mockEq2 = vi.fn().mockResolvedValue(response)
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { delete: mockDelete }, mockDelete, mockEq1, mockEq2 }
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

  it('returns 400 when the maximum is reached', async () => {
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

    const res = await request(buildApp())
      .post('/api/cover-letters')
      .send({
        file_url: `${USER_ID}/cover-letter.pdf`,
      })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: 'maximum cover letter variations reached',
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
