import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { invalidateBillingStatus } from './useBilling'

export interface CoverLetterTokens {
  id: string
  user_id: string
  key: string
  value: string
  position: number
  created_at: string
  updated_at: string
}

interface UpdateCoverLetterTokensPayload {
  tokens: Array<Pick<CoverLetterTokens, 'key' | 'value'>>
}

export function useCoverLetterTokens() {
  return useQuery({
    queryKey: ['cover-letter-tokens'],
    queryFn: () => api.get<CoverLetterTokens[]>('/api/cover-letters/tokens'),
  })
}

export function useUpdateCoverLetterTokens() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCoverLetterTokensPayload) =>
      api.put<CoverLetterTokens[]>('/api/cover-letters/tokens', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['cover-letter-tokens'], data)
      void invalidateBillingStatus(queryClient)
    },
  })
}
