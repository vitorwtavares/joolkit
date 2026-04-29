import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Location {
  id: string
  user_id: string
  name: string
  created_at: string
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get<Location[]>('/api/locations'),
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      api.post<Location>('/api/locations', { name }),
    onSuccess: (data) => {
      queryClient.setQueryData<Location[]>(['locations'], (prev) =>
        prev
          ? [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
          : [data],
      )
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put<Location>(`/api/locations/${id}`, { name }),
    onSuccess: (data) => {
      queryClient.setQueryData<Location[]>(['locations'], (prev) =>
        prev
          ? prev
              .map((l) => (l.id === data.id ? data : l))
              .sort((a, b) => a.name.localeCompare(b.name))
          : [data],
      )
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/api/locations/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Location[]>(['locations'], (prev) =>
        prev ? prev.filter((l) => l.id !== id) : [],
      )
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
