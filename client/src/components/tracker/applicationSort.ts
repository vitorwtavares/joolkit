import type { Application } from '@/api/hooks/useApplications'
import type { SortConfig } from '@/api/hooks/useTrackerViews'
import { STATUS_CONFIG } from './statusConfig'

type SortType = 'text' | 'date' | 'status'

export interface SortableField {
  field: keyof Application
  label: string
  type: SortType
}

// Curated subset of columns; salary and the low-value enums are left out.
export const SORTABLE_FIELDS: SortableField[] = [
  { field: 'company_name', label: 'Company', type: 'text' },
  { field: 'job_name', label: 'Job title', type: 'text' },
  { field: 'status', label: 'Status', type: 'status' },
  { field: 'date_applied', label: 'Date applied', type: 'date' },
  { field: 'created_at', label: 'Date added', type: 'date' },
]

// STATUS_CONFIG is declared in pipeline order, so its key order is the rank.
const STATUS_ORDER = Object.keys(STATUS_CONFIG)
const statusRank = (status: string) => {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? STATUS_ORDER.length : i
}

export function directionLabels(type: SortType): { asc: string; desc: string } {
  switch (type) {
    case 'date':
      return { asc: 'Oldest', desc: 'Newest' }
    case 'status':
      return { asc: 'Pipeline', desc: 'Reverse' }
    default:
      return { asc: 'A–Z', desc: 'Z–A' }
  }
}

// Dates default to newest-first to match the table's default order.
export function defaultDirection(type: SortType): SortConfig['direction'] {
  return type === 'date' ? 'desc' : 'asc'
}

// Null = no value for this field; such rows are forced last when sorting.
function comparable(
  app: Application,
  field: keyof Application,
  type: SortType,
): string | number | null {
  if (type === 'status') return statusRank(app.status)

  const value = app[field]
  if (value == null || value === '') return null
  if (type === 'date') return new Date(value as string).getTime()
  return String(value).toLowerCase()
}

// Nulls sink to the bottom in both directions; equal rows keep incoming order
// (stable sort), so the server's created_at ordering stays the tiebreaker.
export function sortApplications(
  apps: Application[],
  sort: SortConfig | null,
): Application[] {
  if (!sort) return apps
  const def = SORTABLE_FIELDS.find((f) => f.field === sort.field)
  if (!def) return apps

  const dir = sort.direction === 'desc' ? -1 : 1
  return [...apps].sort((a, b) => {
    const va = comparable(a, def.field, def.type)
    const vb = comparable(b, def.field, def.type)

    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1

    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
    return dir * cmp
  })
}
