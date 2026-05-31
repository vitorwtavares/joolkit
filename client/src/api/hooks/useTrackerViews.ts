import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface FilterConfig {
  field: 'status' | 'is_favorite'
  operator: 'is' | 'is_not' | 'includes'
  values: (string | boolean)[]
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface TrackerView {
  id: string
  user_id: string
  name: string
  position: number
  is_permanent: boolean
  filter_config: FilterConfig | null
  sort_config: SortConfig | null
  hidden_columns: string[] | null
  created_at: string
  updated_at: string
}

export const TRACKER_VIEWS_KEY = ['tracker-views'] as const

// Fetches the user's saved views (ordered by position). The server seeds the
// default set on first load, so this never resolves to an empty list.
export function useTrackerViews() {
  return useQuery({
    queryKey: TRACKER_VIEWS_KEY,
    queryFn: () => api.get<TrackerView[]>('/api/tracker/views'),
  })
}

export interface CreateTrackerViewPayload {
  name: string
  filter_config?: FilterConfig | null
  sort_config?: SortConfig | null
  hidden_columns?: string[] | null
}

export type UpdateTrackerViewPayload = {
  id: string
} & Partial<CreateTrackerViewPayload>

// Appends the new view to the cached list so the tab strip updates without a
// refetch; the server assigns its position at the end of the list.
export function useCreateTrackerView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTrackerViewPayload) =>
      api.post<TrackerView>('/api/tracker/views', payload),
    onSuccess: (view) => {
      queryClient.setQueryData<TrackerView[]>(TRACKER_VIEWS_KEY, (old) =>
        old ? [...old, view] : [view],
      )
    },
  })
}

// Optimistic: the patched fields (name, sort_config, filter_config,
// hidden_columns) drive the UI directly — applying them to the cache before the
// request resolves keeps controls like sort feeling instant. Rolls back on
// error, then reconciles with the server's row on success.
export function useUpdateTrackerView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateTrackerViewPayload) =>
      api.put<TrackerView>(`/api/tracker/views/${id}`, patch),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: TRACKER_VIEWS_KEY })
      const previous =
        queryClient.getQueryData<TrackerView[]>(TRACKER_VIEWS_KEY)
      queryClient.setQueryData<TrackerView[]>(TRACKER_VIEWS_KEY, (old) =>
        old?.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(TRACKER_VIEWS_KEY, ctx.previous)
    },
    onSuccess: (view) => {
      queryClient.setQueryData<TrackerView[]>(
        TRACKER_VIEWS_KEY,
        (old) => old?.map((v) => (v.id === view.id ? view : v)) ?? [view],
      )
    },
  })
}

export function useDeleteTrackerView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/api/tracker/views/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<TrackerView[]>(TRACKER_VIEWS_KEY, (old) =>
        old?.filter((v) => v.id !== id),
      )
      // Drop the deleted view's applications cache so it doesn't linger.
      queryClient.removeQueries({ queryKey: ['applications', id] })
    },
  })
}
