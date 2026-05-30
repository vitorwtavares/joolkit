import { useQuery } from '@tanstack/react-query'
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
