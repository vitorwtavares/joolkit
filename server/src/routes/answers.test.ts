import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
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
import answersRouter from './answers'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/answers', answersRouter)
  return app
}

const mockGetSupabase = vi.mocked(authModule.getSupabase)

type AnyFn = ReturnType<typeof vi.fn>

function selectEqOrderHandler(response: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(response)
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  return { builder: { select }, select, eq, order }
}

function selectEqCountHandler(response: {
  count: number | null
  error: unknown
}) {
  const eq = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ eq })
  return { builder: { select }, select, eq }
}

function selectEqHandler(response: { data: unknown; error: unknown }) {
  const eq = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ eq })
  return { builder: { select }, select, eq }
}

function insertSelectSingleHandler(response: {
  data: unknown
  error: unknown
}) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  return { builder: { insert }, insert, select, single }
}

function updateEqEqHandler(response: { data?: unknown; error: unknown }) {
  const eq2 = vi.fn().mockResolvedValue(response)
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const update = vi.fn().mockReturnValue({ eq: eq1 })
  return { builder: { update }, update, eq1, eq2 }
}

function updateEqEqSelectMaybeSingleHandler(response: {
  data: unknown
  error: unknown
}) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ maybeSingle })
  const eq2 = vi.fn().mockReturnValue({ select })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const update = vi.fn().mockReturnValue({ eq: eq1 })
  return { builder: { update }, update, eq1, eq2 }
}

function deleteEqEqSelectMaybeSingleHandler(response: {
  data: unknown
  error: unknown
}) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ maybeSingle })
  const eq2 = vi.fn().mockReturnValue({ select })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const del = vi.fn().mockReturnValue({ eq: eq1 })
  return { builder: { delete: del }, delete: del, eq1, eq2 }
}

function mockFromSequence(handlers: Array<{ builder: Record<string, AnyFn> }>) {
  const from = vi.fn()
  handlers.forEach((h) => from.mockReturnValueOnce(h.builder))
  mockGetSupabase.mockReturnValue({ from } as never)
  return from
}

const baseAnswer = {
  id: 'a1',
  user_id: 'test-user-id',
  question: 'Q1',
  short_answer: 'S1',
  long_answer: null,
  preferred_variant: 'short',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/answers', () => {
  it('auto-assigns position = count + 1 and ignores a client-sent position', async () => {
    const count = selectEqCountHandler({ count: 3, error: null })
    const insert = insertSelectSingleHandler({
      data: { ...baseAnswer, id: 'a4', position: 4 },
      error: null,
    })
    mockFromSequence([count, insert])

    const res = await request(buildApp()).post('/api/answers').send({
      position: 99,
      question: 'Q?',
      short_answer: 'S',
    })

    expect(res.status).toBe(201)
    const payload = insert.insert.mock.calls[0][0]
    expect(payload).toMatchObject({
      user_id: 'test-user-id',
      position: 4,
      short_answer: 'S',
    })
    expect(payload).not.toHaveProperty('id')
  })

  it('rejects with 400 when MAX_ANSWERS is reached', async () => {
    const count = selectEqCountHandler({ count: 40, error: null })
    mockFromSequence([count])

    const res = await request(buildApp())
      .post('/api/answers')
      .send({ short_answer: 'S' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Maximum of 40 answers reached' })
  })
})

describe('PUT /api/answers/reorder', () => {
  it('rejects malformed payloads', async () => {
    const cases = [
      { orderedIds: 'nope' },
      { orderedIds: [] },
      { orderedIds: Array.from({ length: 41 }, (_, i) => `id${i}`) },
      { orderedIds: ['a', ''] },
    ]
    for (const body of cases) {
      const res = await request(buildApp())
        .put('/api/answers/reorder')
        .send(body)
      expect(res.status).toBe(400)
    }
  })

  it("rejects when payload length does not match the user's answers", async () => {
    const existing = selectEqHandler({
      data: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
      error: null,
    })
    mockFromSequence([existing])

    const res = await request(buildApp())
      .put('/api/answers/reorder')
      .send({ orderedIds: ['a1', 'a2'] })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/every answer for this user exactly once/)
  })

  it('rejects when payload has same length but contains an unknown id', async () => {
    const existing = selectEqHandler({
      data: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
      error: null,
    })
    mockFromSequence([existing])

    const res = await request(buildApp())
      .put('/api/answers/reorder')
      .send({ orderedIds: ['a1', 'a2', 'x'] })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/every answer for this user exactly once/)
  })

  it('writes sequential positions in the requested order and returns the refetched list', async () => {
    const existing = selectEqHandler({
      data: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
      error: null,
    })
    const update1 = updateEqEqHandler({ error: null })
    const update2 = updateEqEqHandler({ error: null })
    const update3 = updateEqEqHandler({ error: null })
    const refetched = [
      { ...baseAnswer, id: 'a3', position: 1 },
      { ...baseAnswer, id: 'a1', position: 2 },
      { ...baseAnswer, id: 'a2', position: 3 },
    ]
    const final = selectEqOrderHandler({ data: refetched, error: null })
    mockFromSequence([existing, update1, update2, update3, final])

    const res = await request(buildApp())
      .put('/api/answers/reorder')
      .send({ orderedIds: ['a3', 'a1', 'a2'] })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(refetched)

    expect(update1.update.mock.calls[0][0]).toMatchObject({ position: 1 })
    expect(update1.eq1).toHaveBeenCalledWith('id', 'a3')
    expect(update2.update.mock.calls[0][0]).toMatchObject({ position: 2 })
    expect(update2.eq1).toHaveBeenCalledWith('id', 'a1')
    expect(update3.update.mock.calls[0][0]).toMatchObject({ position: 3 })
    expect(update3.eq1).toHaveBeenCalledWith('id', 'a2')
  })
})

describe('PUT /api/answers/:id', () => {
  it('updates only the provided fields (plus updated_at) and scopes to the owner', async () => {
    const upd = updateEqEqSelectMaybeSingleHandler({
      data: { ...baseAnswer, question: 'new Q' },
      error: null,
    })
    mockFromSequence([upd])

    await request(buildApp()).put('/api/answers/a1').send({ question: 'new Q' })

    const payload = upd.update.mock.calls[0][0]
    expect(payload).toMatchObject({ question: 'new Q' })
    expect(payload).toHaveProperty('updated_at')
    expect(payload).not.toHaveProperty('short_answer')
    expect(upd.eq1).toHaveBeenCalledWith('id', 'a1')
    expect(upd.eq2).toHaveBeenCalledWith('user_id', 'test-user-id')
  })

  it('returns 404 when no row matches', async () => {
    const upd = updateEqEqSelectMaybeSingleHandler({ data: null, error: null })
    mockFromSequence([upd])

    const res = await request(buildApp())
      .put('/api/answers/missing')
      .send({ question: 'x' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/answers/:id', () => {
  it('returns 404 when the id is not found', async () => {
    const del = deleteEqEqSelectMaybeSingleHandler({ data: null, error: null })
    mockFromSequence([del])

    const res = await request(buildApp()).delete('/api/answers/missing')
    expect(res.status).toBe(404)
  })

  it('compacts remaining positions and returns the updated list', async () => {
    const del = deleteEqEqSelectMaybeSingleHandler({
      data: { ...baseAnswer, id: 'a2', position: 2 },
      error: null,
    })
    // After deleting a2 (position 2), remaining rows are a1@1, a3@3
    const remaining = selectEqOrderHandler({
      data: [
        { ...baseAnswer, id: 'a1', position: 1 },
        { ...baseAnswer, id: 'a3', position: 3 },
      ],
      error: null,
    })
    const compact = updateEqEqHandler({ error: null })
    mockFromSequence([del, remaining, compact])

    const res = await request(buildApp()).delete('/api/answers/a2')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      expect.objectContaining({ id: 'a1', position: 1 }),
      expect.objectContaining({ id: 'a3', position: 2 }),
    ])
    expect(compact.update.mock.calls[0][0]).toMatchObject({ position: 2 })
    expect(compact.eq1).toHaveBeenCalledWith('id', 'a3')
    expect(compact.eq2).toHaveBeenCalledWith('user_id', 'test-user-id')
  })
})
