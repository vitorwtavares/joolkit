import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface FilterConfig {
  field: 'status' | 'is_favorite'
  // Both operators are multi-select: 'is' = matches any of the values,
  // 'is_not' = matches none of them. Surfaced as "Includes" / "Excludes".
  operator: 'is' | 'is_not'
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
const TRACKER_VIEW_UPDATE_KEY = ['tracker-views', 'update'] as const

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

// Optimistic update with burst-safe reconciliation. Rapid edits (e.g. toggling
// columns quickly) fire overlapping updates whose responses can resolve out of
// order, so we never write a response back per-mutation — that would let a stale
// one clobber newer state. Instead we trust the optimistic cache and invalidate
// once, after the last in-flight update settles.
export function useUpdateTrackerView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: TRACKER_VIEW_UPDATE_KEY,
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
      if (
        ctx?.previous &&
        queryClient.isMutating({ mutationKey: TRACKER_VIEW_UPDATE_KEY }) === 1
      )
        queryClient.setQueryData(TRACKER_VIEWS_KEY, ctx.previous)
    },
    onSettled: () => {
      if (
        queryClient.isMutating({ mutationKey: TRACKER_VIEW_UPDATE_KEY }) === 1
      )
        queryClient.invalidateQueries({ queryKey: TRACKER_VIEWS_KEY })
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
    },
  })
}
