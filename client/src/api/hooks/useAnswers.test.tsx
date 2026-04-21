import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { Answer } from './useAnswers'
import { useReorderAnswers, useDeleteAnswer } from './useAnswers'

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../api'

const mockApi = vi.mocked(api)

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'a1',
    user_id: 'user-1',
    position: 1,
    question: 'Q',
    short_answer: 'S',
    long_answer: null,
    preferred_variant: 'short',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useReorderAnswers', () => {
  it('applies optimistic reorder with refreshed positions', async () => {
    const queryClient = makeQueryClient()
    const a1 = makeAnswer({ id: 'a1', position: 1 })
    const a2 = makeAnswer({ id: 'a2', position: 2 })
    const a3 = makeAnswer({ id: 'a3', position: 3 })
    queryClient.setQueryData<Answer[]>(['answers'], [a1, a2, a3])

    // Never-resolving promise so we can inspect the optimistic state
    let resolvePut: (value: Answer[]) => void
    mockApi.put.mockReturnValue(
      new Promise<Answer[]>((resolve) => {
        resolvePut = resolve
      }),
    )

    const { result } = renderHook(() => useReorderAnswers(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(['a3', 'a1', 'a2'])

    await waitFor(() => {
      const cache = queryClient.getQueryData<Answer[]>(['answers'])
      expect(cache?.map((a) => a.id)).toEqual(['a3', 'a1', 'a2'])
      expect(cache?.map((a) => a.position)).toEqual([1, 2, 3])
    })

    const serverResponse: Answer[] = [
      { ...a3, position: 1 },
      { ...a1, position: 2 },
      { ...a2, position: 3 },
    ]
    resolvePut!(serverResponse)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData<Answer[]>(['answers'])).toEqual(
      serverResponse,
    )
    expect(mockApi.put).toHaveBeenCalledWith('/api/answers/reorder', {
      orderedIds: ['a3', 'a1', 'a2'],
    })
  })

  it('rolls back to the previous cache on error', async () => {
    const queryClient = makeQueryClient()
    const a1 = makeAnswer({ id: 'a1', position: 1 })
    const a2 = makeAnswer({ id: 'a2', position: 2 })
    const previous = [a1, a2]
    queryClient.setQueryData<Answer[]>(['answers'], previous)

    mockApi.put.mockRejectedValue(new Error('reorder failed'))

    const { result } = renderHook(() => useReorderAnswers(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(['a2', 'a1'])

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData<Answer[]>(['answers'])).toEqual(previous)
  })
})

describe('useDeleteAnswer', () => {
  it('replaces the cache with the compacted list returned by the server', async () => {
    const queryClient = makeQueryClient()
    const a1 = makeAnswer({ id: 'a1', position: 1 })
    const a2 = makeAnswer({ id: 'a2', position: 2 })
    const a3 = makeAnswer({ id: 'a3', position: 3 })
    queryClient.setQueryData<Answer[]>(['answers'], [a1, a2, a3])

    const compacted: Answer[] = [
      { ...a1, position: 1 },
      { ...a3, position: 2 },
    ]
    mockApi.delete.mockResolvedValue(compacted)

    const { result } = renderHook(() => useDeleteAnswer(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate('a2')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/api/answers/a2')
    expect(queryClient.getQueryData<Answer[]>(['answers'])).toEqual(compacted)
  })
})
