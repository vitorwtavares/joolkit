import type { Answer } from '@/api/hooks/useAnswers'

export type AnswerSortField = 'question' | 'created_at' | 'updated_at'
export type SortDirection = 'asc' | 'desc'

export interface AnswerSortConfig {
  field: AnswerSortField
  direction: SortDirection
}

type SortType = 'text' | 'date'

export interface AnswerSortableField {
  field: AnswerSortField
  label: string
  type: SortType
}

export const ANSWER_SORTABLE_FIELDS: AnswerSortableField[] = [
  { field: 'question', label: 'Alphabetical', type: 'text' },
  { field: 'created_at', label: 'Date created', type: 'date' },
  { field: 'updated_at', label: 'Last edited', type: 'date' },
]

export function directionLabels(type: SortType): { asc: string; desc: string } {
  return type === 'date'
    ? { asc: 'Oldest', desc: 'Newest' }
    : { asc: 'A–Z', desc: 'Z–A' }
}

// Dates default to newest-first, the most useful order for recency.
export function defaultDirection(type: SortType): SortDirection {
  return type === 'date' ? 'desc' : 'asc'
}

// Null = no value for this field; such rows are forced last when sorting.
function comparable(
  answer: Answer,
  field: AnswerSortField,
  type: SortType,
): string | number | null {
  const value = answer[field]
  if (value == null || value === '') return null
  if (type === 'date') return new Date(value).getTime()
  return String(value).toLowerCase()
}

// Nulls sink to the bottom in both directions; equal rows keep incoming order
// (stable sort), so the server's position ordering stays the tiebreaker.
export function sortAnswers(
  answers: Answer[],
  sort: AnswerSortConfig | null,
): Answer[] {
  if (!sort) return answers
  const def = ANSWER_SORTABLE_FIELDS.find((f) => f.field === sort.field)
  if (!def) return answers

  const dir = sort.direction === 'desc' ? -1 : 1
  return [...answers].sort((a, b) => {
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
