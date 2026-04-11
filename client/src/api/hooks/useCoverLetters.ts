import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface CoverLetterTemplate {
  id: string
  user_id: string
  variation: 'formal' | 'light'
  file_url: string | null
  content: unknown
  created_at: string
  updated_at: string
}

export function useCoverLetters() {
  return useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => api.get<CoverLetterTemplate[]>('/api/cover-letters'),
  })
}

export function useDeleteCoverLetterTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variation: 'formal' | 'light') =>
      api.delete<void>(`/api/cover-letters/${variation}`),
    onSuccess: (_, variation) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) => prev?.filter((t) => t.variation !== variation) ?? [],
      )
    },
  })
}

export function useUpdateCoverLetterFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      variation,
      file_url,
    }: {
      variation: 'formal' | 'light'
      file_url: string
    }) =>
      api.put<CoverLetterTemplate>(`/api/cover-letters/${variation}/file`, {
        file_url,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) => {
          if (!prev) return [data]
          const exists = prev.some((t) => t.variation === data.variation)
          return exists
            ? prev.map((t) => (t.variation === data.variation ? data : t))
            : [...prev, data]
        },
      )
    },
  })
}
