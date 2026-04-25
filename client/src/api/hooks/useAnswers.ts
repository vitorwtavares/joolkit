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
      payload: Omit<
        Answer,
        'id' | 'user_id' | 'position' | 'created_at' | 'updated_at'
      >,
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

export function useReorderAnswers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.put<Answer[]>('/api/answers/reorder', { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['answers'] })
      const previous = queryClient.getQueryData<Answer[]>(['answers'])
      queryClient.setQueryData<Answer[]>(['answers'], (prev) => {
        if (!prev) return prev
        const byId = new Map(prev.map((a) => [a.id, a]))
        return orderedIds
          .map((id, i) => {
            const a = byId.get(id)
            return a ? { ...a, position: i + 1 } : null
          })
          .filter((a): a is Answer => a !== null)
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['answers'], context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Answer[]>(['answers'], data)
    },
  })
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Answer[]>(`/api/answers/${id}`),
    onSuccess: (data) => {
      queryClient.setQueryData<Answer[]>(['answers'], data)
    },
  })
}
