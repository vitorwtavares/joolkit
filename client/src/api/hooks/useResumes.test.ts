import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { ResumeVariation } from './useResumes'
import {
  useCreateResumeVariation,
  useDeleteResumeVariation,
  useResumes,
  useUpdateResumeFile,
  useUpdateResumeLabel,
} from './useResumes'

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

const firstResume: ResumeVariation = {
  id: '1',
  user_id: 'user-1',
  position: 1,
  label: 'Resume 1',
  file_url: 'user-1/1/resume.pdf',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const secondResume: ResumeVariation = {
  id: '2',
  user_id: 'user-1',
  position: 2,
  label: 'Resume 2',
  file_url: 'user-1/2/resume.pdf',
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

describe('useResumes', () => {
  it('fetches and returns resume variations', async () => {
    const queryClient = makeQueryClient()
    mockApi.get.mockResolvedValue([firstResume, secondResume])

    const { result } = renderHook(() => useResumes(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([firstResume, secondResume])
    expect(mockApi.get).toHaveBeenCalledWith('/api/resumes')
  })
})

describe('useCreateResumeVariation cache update', () => {
  it('inserts a new resume variation in position order', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<ResumeVariation[]>(['resumes'], [secondResume])
    mockApi.post.mockResolvedValue(firstResume)

    const { result } = renderHook(() => useCreateResumeVariation(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      label: 'Resume 1',
      file_url: 'user-1/1/resume.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<ResumeVariation[]>(['resumes'])
    expect(cached).toEqual([firstResume, secondResume])
  })
})

describe('useUpdateResumeFile cache update', () => {
  it('replaces an existing resume variation without duplicating it', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<ResumeVariation[]>(
      ['resumes'],
      [firstResume, secondResume],
    )

    const updatedSecond: ResumeVariation = {
      ...secondResume,
      file_url: 'user-1/2/updated-resume.pdf',
    }
    mockApi.put.mockResolvedValue(updatedSecond)

    const { result } = renderHook(() => useUpdateResumeFile(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      id: '2',
      file_url: 'user-1/2/updated-resume.pdf',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<ResumeVariation[]>(['resumes'])
    expect(cached).toHaveLength(2)
    expect(cached!.find((resume) => resume.position === 2)?.file_url).toBe(
      'user-1/2/updated-resume.pdf',
    )
  })
})

describe('useDeleteResumeVariation cache update', () => {
  it('replaces cache with the compacted resume list returned by the server', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<ResumeVariation[]>(
      ['resumes'],
      [firstResume, secondResume],
    )
    const compactedSecondResume: ResumeVariation = {
      ...secondResume,
      position: 1,
    }
    mockApi.delete.mockResolvedValue([compactedSecondResume])

    const { result } = renderHook(() => useDeleteResumeVariation(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData<ResumeVariation[]>(['resumes'])
    expect(cached).toEqual([compactedSecondResume])
    expect(cached?.[0]?.label).toBe('Resume 2')
  })
})

describe('useUpdateResumeLabel cache update', () => {
  it('replaces the renamed resume variation in cache', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<ResumeVariation[]>(
      ['resumes'],
      [firstResume, secondResume],
    )

    const renamedSecond: ResumeVariation = {
      ...secondResume,
      label: 'Senior frontend',
    }
    mockApi.put.mockResolvedValue(renamedSecond)

    const { result } = renderHook(() => useUpdateResumeLabel(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      id: '2',
      label: 'Senior frontend',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApi.put).toHaveBeenCalledWith('/api/resumes/2', {
      label: 'Senior frontend',
    })
    const cached = queryClient.getQueryData<ResumeVariation[]>(['resumes'])
    expect(cached).toHaveLength(2)
    expect(cached!.find((resume) => resume.position === 2)?.label).toBe(
      'Senior frontend',
    )
  })
})
