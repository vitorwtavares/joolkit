// Columns the user can show/hide per view via the Columns control. The star
// (favorite + row actions) and company columns are core to a row's identity and
// are always shown, so they're excluded here. Order matches the table's
// left-to-right order. Visibility is persisted on the view as `hidden_columns`
// (an explicit list of hidden keys; null/empty = everything shown) and applied
// client-side.
export interface TrackerColumn {
  key: string
  label: string
}

export const TOGGLEABLE_COLUMNS: TrackerColumn[] = [
  { key: 'jobName', label: 'Job title' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'salary', label: 'Salary' },
  { key: 'workStyle', label: 'Work style' },
  { key: 'visa', label: 'Visa' },
  { key: 'applied', label: 'Applied' },
  { key: 'nextDeadline', label: 'Next deadline' },
  { key: 'timeInStage', label: 'Time in stage' },
  { key: 'skills', label: 'Skills' },
]

export const DEFAULT_ALL_VIEW_HIDDEN_COLUMNS = [
  'salary',
  'workStyle',
  'visa',
  'skills',
]

export function isColumnVisible(
  key: string,
  hiddenColumns: string[] | null | undefined,
): boolean {
  return !hiddenColumns?.includes(key)
}
