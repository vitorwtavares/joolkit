import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface CoverLetterTokens {
  id: string
  user_id: string
  role: string | null
  company: string | null
  updated_at: string
}

export type UpdateCoverLetterTokensPayload = Partial<
  Pick<CoverLetterTokens, 'role' | 'company'>
>

export function useCoverLetterTokens() {
  return useQuery({
    queryKey: ['cover-letter-tokens'],
    queryFn: () =>
      api.get<CoverLetterTokens | null>('/api/cover-letters/tokens'),
  })
}

export function useUpdateCoverLetterTokens() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCoverLetterTokensPayload) =>
      api.put<CoverLetterTokens>('/api/cover-letters/tokens', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['cover-letter-tokens'], data)
    },
  })
}
