import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import type { AuthRequest } from '../middleware/auth'

vi.mock('../middleware/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('../middleware/auth')>()
  return {
    ...original,
    getSupabase: vi.fn(),
    authMiddleware: (
      req: AuthRequest,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.userId = 'test-user-id'
      next()
    },
  }
})

vi.mock('../utils/browser', () => ({
  getBrowser: vi.fn(),
}))

import * as authModule from '../middleware/auth'
import { getBrowser } from '../utils/browser'
import exportRouter from './export'

const mockGetSupabase = vi.mocked(authModule.getSupabase)
const mockGetBrowser = vi.mocked(getBrowser)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(authModule.authMiddleware)
  app.use('/api/export', exportRouter)
  return app
}

function mockSupabase({
  content = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
    ],
  },
  role = 'Engineer',
  company = 'Acme',
}: {
  content?: Record<string, unknown> | null
  role?: string | null
  company?: string | null
} = {}) {
  const templateMaybeSingle = vi.fn().mockResolvedValue({
    data: content ? { content } : null,
    error: null,
  })
  const templateEqVariation = vi.fn().mockReturnValue({
    maybeSingle: templateMaybeSingle,
  })
  const templateEqUser = vi.fn().mockReturnValue({ eq: templateEqVariation })
  const templateSelect = vi.fn().mockReturnValue({
    eq: templateEqUser,
  })

  const tokensEqUser = vi.fn().mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({
      data: { role, company },
      error: null,
    }),
  })
  const tokensSelect = vi.fn().mockReturnValue({
    eq: tokensEqUser,
  })

  const mockFrom = vi.fn((table: string) => {
    if (table === 'cover_letter_templates') {
      return { select: templateSelect }
    }
    if (table === 'cover_letter_tokens') {
      return { select: tokensSelect }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  mockGetSupabase.mockReturnValue({ from: mockFrom } as never)
}

describe('POST /api/export/cover-letter/:variation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a pdf and renders without external font requests', async () => {
    mockSupabase()

    const setContent = vi.fn().mockResolvedValue(undefined)
    const pdf = vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3]))
    const close = vi.fn().mockResolvedValue(undefined)
    const newPage = vi.fn().mockResolvedValue({
      setContent,
      pdf,
      close,
    })

    mockGetBrowser.mockResolvedValue({ newPage } as never)

    const res = await request(buildApp()).post(
      '/api/export/cover-letter/formal',
    )

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(setContent).toHaveBeenCalledWith(
      expect.not.stringContaining('fonts.googleapis.com'),
      { waitUntil: 'domcontentloaded' },
    )
    expect(pdf).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })

  it('returns 500 when the browser render fails', async () => {
    mockSupabase()

    const close = vi.fn().mockResolvedValue(undefined)
    const newPage = vi.fn().mockResolvedValue({
      setContent: vi.fn().mockRejectedValue(new Error('navigation timeout')),
      close,
    })

    mockGetBrowser.mockResolvedValue({ newPage } as never)

    const res = await request(buildApp()).post('/api/export/cover-letter/light')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'PDF generation failed' })
    expect(close).toHaveBeenCalled()
  })

  it('returns 404 when the cover letter content is missing', async () => {
    mockSupabase({ content: null })

    const res = await request(buildApp()).post(
      '/api/export/cover-letter/formal',
    )

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'cover letter content not found' })
    expect(mockGetBrowser).not.toHaveBeenCalled()
  })
})
