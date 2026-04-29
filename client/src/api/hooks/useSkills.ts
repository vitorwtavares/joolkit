import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Skill {
  id: string
  user_id: string
  name: string
  created_at: string
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get<Skill[]>('/api/skills'),
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post<Skill>('/api/skills', { name }),
    onSuccess: (data) => {
      queryClient.setQueryData<Skill[]>(['skills'], (prev) =>
        prev
          ? [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
          : [data],
      )
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put<Skill>(`/api/skills/${id}`, { name }),
    onSuccess: (data) => {
      queryClient.setQueryData<Skill[]>(['skills'], (prev) =>
        prev
          ? prev
              .map((s) => (s.id === data.id ? data : s))
              .sort((a, b) => a.name.localeCompare(b.name))
          : [data],
      )
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/skills/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Skill[]>(['skills'], (prev) =>
        prev ? prev.filter((s) => s.id !== id) : [],
      )
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
