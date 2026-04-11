import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase before api.ts is imported
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

import { supabase } from './supabase'
import { api } from './api'

const mockGetSession = vi.mocked(supabase.auth.getSession)

function stubFetch() {
  const capturedHeaders: Record<string, string>[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url: string, options: RequestInit) => {
      capturedHeaders.push((options.headers ?? {}) as Record<string, string>)
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    }),
  )
  return capturedHeaders
}

describe('api request function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } } as never)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends no Authorization header when there is no active session', async () => {
    const headers = stubFetch()
    await api.get('/api/test')
    expect(headers[0]['Authorization']).toBeUndefined()
  })

  it('injects Authorization header when a session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'my-token' } },
    } as never)
    const headers = stubFetch()
    await api.get('/api/test')
    expect(headers[0]['Authorization']).toBe('Bearer my-token')
  })

  it('adds Content-Type for POST requests with a body', async () => {
    const headers = stubFetch()
    await api.post('/api/test', { name: 'Alice' })
    expect(headers[0]['Content-Type']).toBe('application/json')
  })

  it('does not add Content-Type for GET requests', async () => {
    const headers = stubFetch()
    await api.get('/api/test')
    expect(headers[0]['Content-Type']).toBeUndefined()
  })

  it('returns undefined for 204 responses without parsing JSON', async () => {
    const jsonSpy = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: jsonSpy }),
    )

    const result = await api.delete('/api/test')

    expect(result).toBeUndefined()
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it('throws the error message from a non-ok JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: 'file_url is required' }),
      }),
    )

    await expect(api.get('/api/test')).rejects.toThrow('file_url is required')
  })

  it('throws a fallback message when the error response is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('not json')),
      }),
    )

    await expect(api.get('/api/test')).rejects.toThrow('Request failed: 500')
  })
})
