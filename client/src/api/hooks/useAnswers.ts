import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Answer {
  id: string
  user_id: string
  position: number
  question: string
  short_answer: string
  long_answer: string | null
  preferred_variant: 'short' | 'long'
  created_at: string
  updated_at: string
}

export function useAnswers() {
  return useQuery({
    queryKey: ['answers'],
    queryFn: () => api.get<Answer[]>('/api/answers'),
  })
}

export function useCreateAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      payload: Omit<Answer, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => api.post<Answer>('/api/answers', payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Answer[]>(['answers'], (prev) =>
        prev ? [...prev, data] : [data],
      )
    },
  })
}

type UpdateAnswerPayload = { id: string } & Partial<
  Pick<
    Answer,
    'question' | 'short_answer' | 'long_answer' | 'preferred_variant'
  >
>

export function useUpdateAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAnswerPayload) =>
      api.put<Answer>(`/api/answers/${id}`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Answer[]>(['answers'], (prev) => {
        if (!prev) {
          queryClient.invalidateQueries({ queryKey: ['answers'] })
          return prev
        }
        return prev.map((a) => (a.id === data.id ? data : a))
      })
    },
  })
}

export function useUpdateAnswerPosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, position }: { id: string; position: number }) =>
      api.put<Answer>(`/api/answers/${id}/position`, { position }),
    onSuccess: (data) => {
      queryClient.setQueryData<Answer[]>(['answers'], (prev) => {
        if (!prev) {
          queryClient.invalidateQueries({ queryKey: ['answers'] })
          return prev
        }
        return prev.map((a) => (a.id === data.id ? data : a))
      })
    },
  })
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/answers/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Answer[]>(
        ['answers'],
        (prev) => prev?.filter((a) => a.id !== id) ?? [],
      )
    },
  })
}
