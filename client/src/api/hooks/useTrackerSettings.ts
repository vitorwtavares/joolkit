import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { ApplicationView } from './useApplications'

export interface TrackerViewSettings {
  id: string
  user_id: string
  view: ApplicationView
  column_order: string[] | null
  hidden_columns: string[] | null
  created_at: string
  updated_at: string
}

export function useTrackerSettings() {
  return useQuery({
    queryKey: ['tracker-settings'],
    queryFn: () => api.get<TrackerViewSettings[]>('/api/tracker/settings'),
  })
}

export function useUpdateTrackerSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      view,
      column_order,
      hidden_columns,
    }: {
      view: ApplicationView
      column_order?: string[]
      hidden_columns?: string[]
    }) =>
      api.put<TrackerViewSettings>(`/api/tracker/settings/${view}`, {
        column_order,
        hidden_columns,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<TrackerViewSettings[]>(
        ['tracker-settings'],
        (prev) => {
          if (!prev) return [data]
          const exists = prev.some((s) => s.view === data.view)
          return exists
            ? prev.map((s) => (s.view === data.view ? data : s))
            : [...prev, data]
        },
      )
    },
  })
}
