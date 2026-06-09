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
import resumesRouter from '.'

const USER_ID = 'test-user-id'

interface ResumeRow {
  id: string
  user_id: string
  position: number
  label: string
  file_url: string
}

function resume(overrides: Partial<ResumeRow> = {}): ResumeRow {
  const position = overrides.position ?? 1
  return {
    id: String(position),
    user_id: USER_ID,
    position,
    label: `Resume ${position}`,
    file_url: `${USER_ID}/${position}/resume.pdf`,
    ...overrides,
  }
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/resumes', resumesRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

function mockSelectChain(response: { data: unknown; error: unknown }) {
  const { builder, mockEq, mockOrder } = createSelectBuilder(response)
  const mockFrom = vi.fn().mockReturnValue(builder)
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockEq, mockOrder }
}

function mockCreateChain({
  existingResumes,
  insertResponse,
}: {
  existingResumes: unknown[]
  insertResponse: { data: unknown; error: unknown }
}) {
  const existingSelect = createSelectBuilder({
    data: existingResumes,
    error: null,
  })
  const insert = createInsertBuilder(insertResponse)
  const mockFrom = vi
    .fn()
    .mockReturnValueOnce(existingSelect.builder)
    .mockReturnValueOnce(insert.builder)
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockInsert: insert.mockInsert }
}

function mockDeleteChain(response: { error: unknown }) {
  const { builder, mockEq1, mockEq2 } = createDeleteBuilder(response)
  const mockFrom = vi.fn().mockReturnValue(builder)
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockEq1, mockEq2 }
}

function mockDeleteAndCompactChain({
  remainingResumes,
  compactedResumes,
  updateResponses = [],
}: {
  remainingResumes: unknown[]
  compactedResumes: unknown[]
  updateResponses?: { error: unknown }[]
}) {
  const deleteResult = createDeleteBuilder({ error: null })
  const remainingSelect = createSelectBuilder({
    data: remainingResumes,
    error: null,
  })
  const compactedSelect = createSelectBuilder({
    data: compactedResumes,
    error: null,
  })
  const updateBuilders = updateResponses.map((response) =>
    createCompactUpdateBuilder(response),
  )

  const mockFrom = vi
    .fn()
    .mockReturnValueOnce(deleteResult.builder)
    .mockReturnValueOnce(remainingSelect.builder)
  for (const updateBuilder of updateBuilders) {
    mockFrom.mockReturnValueOnce(updateBuilder.builder)
  }
  mockFrom.mockReturnValueOnce(compactedSelect.builder)

  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return {
    mockFrom,
    mockDelete: deleteResult.mockDelete,
    mockDeleteUserEq: deleteResult.mockEq1,
    mockDeleteIdEq: deleteResult.mockEq2,
    updateBuilders,
  }
}

function mockUpdateChain(response: { data: unknown; error: unknown }) {
  const { builder, mockUpdate, mockEq1, mockEq2 } =
    createUpdateBuilder(response)
  const mockFrom = vi.fn().mockReturnValue(builder)
  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
  return { mockFrom, mockUpdate, mockEq1, mockEq2 }
}

describe('GET /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches resume variations for the current user in position order', async () => {
    const resumeVariations = [resume({ file_url: '1.pdf' })]
    const { mockFrom, mockEq, mockOrder } = mockSelectChain({
      data: resumeVariations,
      error: null,
    })

    const res = await request(buildApp()).get('/api/resumes')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(resumeVariations)
    expect(mockFrom).toHaveBeenCalledWith('resume_variations')
    expect(mockEq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(mockOrder).toHaveBeenCalledWith('position', { ascending: true })
  })
})

describe('POST /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when file_url is missing', async () => {
    const res = await request(buildApp()).post('/api/resumes').send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'file_url is required' })
  })

  it('returns 400 when file_url is outside the current user folder', async () => {
    const res = await request(buildApp())
      .post('/api/resumes')
      .send({ file_url: 'other-user/resume.pdf' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: 'file_url must belong to the current user',
    })
  })

  it('creates a resume variation at the next position', async () => {
    const { mockFrom, mockInsert } = mockCreateChain({
      existingResumes: [{ id: '1', position: 1 }],
      insertResponse: {
        data: resume({
          position: 2,
          label: 'Senior frontend',
          file_url: `${USER_ID}/resume.pdf`,
        }),
        error: null,
      },
    })

    const res = await request(buildApp())
      .post('/api/resumes')
      .send({
        label: 'Senior frontend',
        file_url: `${USER_ID}/resume.pdf`,
      })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('resume_variations')
    const insertPayload = mockInsert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      user_id: USER_ID,
      position: 2,
      label: 'Senior frontend',
      file_url: `${USER_ID}/resume.pdf`,
    })
    expect(insertPayload).toHaveProperty('updated_at')
  })

  it('uses a default label when label is missing', async () => {
    const { mockInsert } = mockCreateChain({
      existingResumes: [],
      insertResponse: {
        data: resume({
          label: 'Resume',
          file_url: `${USER_ID}/resume.pdf`,
        }),
        error: null,
      },
    })

    const res = await request(buildApp())
      .post('/api/resumes')
      .send({ file_url: `${USER_ID}/resume.pdf` })

    expect(res.status).toBe(200)
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      position: 1,
      label: 'Resume',
    })
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockCreateChain({
      existingResumes: [],
      insertResponse: { data: null, error: { message: 'db error' } },
    })

    const res = await request(buildApp())
      .post('/api/resumes')
      .send({ file_url: `${USER_ID}/resume.pdf` })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'db error' })
  })
})

describe('PUT /api/resumes/:id/file', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when file_url is missing', async () => {
    const res = await request(buildApp()).put('/api/resumes/2/file').send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'file_url is required' })
  })

  it('returns 400 when file_url is outside the current user folder', async () => {
    const res = await request(buildApp())
      .put('/api/resumes/2/file')
      .send({ file_url: 'other-user/resume.pdf' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: 'file_url must belong to the current user',
    })
  })

  it('updates an existing resume file by id', async () => {
    const { mockFrom, mockUpdate, mockEq1, mockEq2 } = mockUpdateChain({
      data: resume({
        position: 2,
        label: 'Senior frontend',
        file_url: `${USER_ID}/resume.pdf`,
      }),
      error: null,
    })

    const res = await request(buildApp())
      .put('/api/resumes/1/file')
      .send({
        file_url: `${USER_ID}/resume.pdf`,
      })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('resume_variations')
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      file_url: `${USER_ID}/resume.pdf`,
    })
    expect(mockUpdate.mock.calls[0][0]).toHaveProperty('updated_at')
    expect(mockEq1).toHaveBeenCalledWith('user_id', USER_ID)
    expect(mockEq2).toHaveBeenCalledWith('id', '1')
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockUpdateChain({ data: null, error: { message: 'db error' } })

    const res = await request(buildApp())
      .put('/api/resumes/1/file')
      .send({ file_url: `${USER_ID}/resume.pdf` })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'db error' })
  })
})

describe('PUT /api/resumes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when label is missing', async () => {
    const res = await request(buildApp()).put('/api/resumes/1').send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'label is required' })
  })

  it('updates a resume label for the current user and id', async () => {
    const { mockFrom, mockUpdate, mockEq1, mockEq2 } = mockUpdateChain({
      data: resume({
        position: 2,
        label: 'Senior frontend',
      }),
      error: null,
    })

    const res = await request(buildApp())
      .put('/api/resumes/2')
      .send({ label: '  Senior frontend  ' })

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('resume_variations')
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      label: 'Senior frontend',
    })
    expect(mockUpdate.mock.calls[0][0]).toHaveProperty('updated_at')
    expect(mockEq1).toHaveBeenCalledWith('user_id', USER_ID)
    expect(mockEq2).toHaveBeenCalledWith('id', '2')
  })

  it('returns 404 when no resume variation matches', async () => {
    mockUpdateChain({ data: null, error: null })

    const res = await request(buildApp())
      .put('/api/resumes/1')
      .send({ label: 'Senior frontend' })

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'resume variation not found' })
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockUpdateChain({ data: null, error: { message: 'update failed' } })

    const res = await request(buildApp())
      .put('/api/resumes/1')
      .send({ label: 'Senior frontend' })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'update failed' })
  })
})

describe('DELETE /api/resumes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the selected resume variation and compacts remaining positions', async () => {
    const [resumeOne, resumeTwo, resumeThree, resumeFive, resumeSix] = [
      1, 2, 3, 5, 6,
    ].map((position) => resume({ position }))
    const compactedResumeFive = { ...resumeFive, position: 4 }
    const compactedResumeSix = { ...resumeSix, position: 5 }
    const { mockFrom, mockDeleteUserEq, mockDeleteIdEq, updateBuilders } =
      mockDeleteAndCompactChain({
        remainingResumes: [
          resumeOne,
          resumeTwo,
          resumeThree,
          resumeFive,
          resumeSix,
        ],
        compactedResumes: [
          resumeOne,
          resumeTwo,
          resumeThree,
          compactedResumeFive,
          compactedResumeSix,
        ],
        updateResponses: [{ error: null }, { error: null }],
      })

    const res = await request(buildApp()).delete('/api/resumes/4')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      resumeOne,
      resumeTwo,
      resumeThree,
      compactedResumeFive,
      compactedResumeSix,
    ])
    expect(mockFrom).toHaveBeenCalledWith('resume_variations')
    expect(mockDeleteUserEq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(mockDeleteIdEq).toHaveBeenCalledWith('id', '4')
    expect(updateBuilders[0].mockUpdate.mock.calls[0][0]).toMatchObject({
      position: 4,
    })
    expect(updateBuilders[0].mockEq1).toHaveBeenCalledWith('user_id', USER_ID)
    expect(updateBuilders[0].mockEq2).toHaveBeenCalledWith('id', '5')
    expect(updateBuilders[1].mockUpdate.mock.calls[0][0]).toMatchObject({
      position: 5,
    })
    expect(updateBuilders[1].mockEq2).toHaveBeenCalledWith('id', '6')
  })

  it('returns 500 when Supabase returns an error', async () => {
    mockDeleteChain({ error: { message: 'delete failed' } })

    const res = await request(buildApp()).delete('/api/resumes/1')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'delete failed' })
  })
})
