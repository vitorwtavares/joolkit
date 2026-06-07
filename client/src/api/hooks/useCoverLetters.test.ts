import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { CoverLetterTemplate } from './useCoverLetters'
import {
  useCreateCoverLetterVariation,
  useCoverLetters,
  useDeleteCoverLetterTemplate,
  useUpdateCoverLetterFile,
  useUpdateCoverLetterLabel,
} from './useCoverLetters'

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

const formalTemplate: CoverLetterTemplate = {
  id: '1',
  user_id: 'user-1',
  variation: 'formal',
  position: 1,
  label: 'Formal',
  file_url: 'https://example.com/formal.pdf',
  content: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const lightTemplate: CoverLetterTemplate = {
  id: '2',
  user_id: 'user-1',
  variation: 'light',
  position: 2,
  label: 'Light',
  file_url: 'https://example.com/light.pdf',
  content: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
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

describe('useCoverLetters', () => {
  it('fetches and returns cover letters', async () => {
    const queryClient = makeQueryClient()
    mockApi.get.mockResolvedValue([formalTemplate, lightTemplate])

    const { result } = renderHook(() => useCoverLetters(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([formalTemplate, lightTemplate])
    expect(mockApi.get).toHaveBeenCalledWith('/api/cover-letters')
  })
})

describe('useDeleteCoverLetterTemplate cache update', () => {
  it('replaces cache with the compacted cover letter list returned by the server', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [formalTemplate, lightTemplate],
    )
    const compactedLight: CoverLetterTemplate = {
      ...lightTemplate,
      position: 1,
    }
    mockApi.delete.mockResolvedValue([compactedLight])

    const { result } = renderHook(() => useDeleteCoverLetterTemplate(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate('formal')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toEqual([compactedLight])
  })

  it('falls back to filtering when the server returns no body', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [formalTemplate, lightTemplate],
    )
    mockApi.delete.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteCoverLetterTemplate(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate('light')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toHaveLength(1)
    expect(cached![0].variation).toBe('formal')
  })
})

describe('useCreateCoverLetterVariation cache update', () => {
  it('inserts a new cover letter variation in position order', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [lightTemplate],
    )
    mockApi.post.mockResolvedValue(formalTemplate)

    const { result } = renderHook(() => useCreateCoverLetterVariation(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      label: 'Formal',
      file_url: 'https://example.com/formal.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toEqual([formalTemplate, lightTemplate])
  })
})

describe('useUpdateCoverLetterFile cache update', () => {
  it('inserts new variation when it does not exist in cache', async () => {
    const queryClient = makeQueryClient()
    // Only formal in cache — light is new
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [formalTemplate],
    )

    const newLight: CoverLetterTemplate = {
      ...lightTemplate,
      file_url: 'https://example.com/new-light.pdf',
    }
    mockApi.put.mockResolvedValue(newLight)

    const { result } = renderHook(() => useUpdateCoverLetterFile(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      variation: 'light',
      file_url: 'https://example.com/new-light.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toHaveLength(2)
    expect(cached!.find((t) => t.variation === 'light')?.file_url).toBe(
      'https://example.com/new-light.pdf',
    )
  })

  it('replaces existing variation in-place without duplicating', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [formalTemplate, lightTemplate],
    )

    const updatedFormal: CoverLetterTemplate = {
      ...formalTemplate,
      file_url: 'https://example.com/updated-formal.pdf',
    }
    mockApi.put.mockResolvedValue(updatedFormal)

    const { result } = renderHook(() => useUpdateCoverLetterFile(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      variation: 'formal',
      file_url: 'https://example.com/updated-formal.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toHaveLength(2)
    const formal = cached!.find((t) => t.variation === 'formal')
    expect(formal?.file_url).toBe('https://example.com/updated-formal.pdf')
  })

  it('initialises cache with [data] when cache is empty', async () => {
    const queryClient = makeQueryClient()

    const newFormal: CoverLetterTemplate = { ...formalTemplate }
    mockApi.put.mockResolvedValue(newFormal)

    const { result } = renderHook(() => useUpdateCoverLetterFile(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      variation: 'formal',
      file_url: 'https://example.com/formal.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toEqual([newFormal])
  })
})

describe('useUpdateCoverLetterLabel cache update', () => {
  it('replaces the renamed cover letter variation in cache', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<CoverLetterTemplate[]>(
      ['cover-letters'],
      [formalTemplate, lightTemplate],
    )

    const renamedLight: CoverLetterTemplate = {
      ...lightTemplate,
      label: 'Direct',
    }
    mockApi.put.mockResolvedValue(renamedLight)

    const { result } = renderHook(() => useUpdateCoverLetterLabel(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      variation: 'light',
      label: 'Direct',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApi.put).toHaveBeenCalledWith('/api/cover-letters/light', {
      label: 'Direct',
    })
    const cached = queryClient.getQueryData<CoverLetterTemplate[]>([
      'cover-letters',
    ])
    expect(cached).toHaveLength(2)
    expect(
      cached!.find((template) => template.variation === 'light')?.label,
    ).toBe('Direct')
  })
})
