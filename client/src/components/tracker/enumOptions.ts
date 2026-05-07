export const WORK_STYLE_OPTIONS = [
  { value: 'remote' as const, label: 'Remote' },
  { value: 'hybrid' as const, label: 'Hybrid' },
  { value: 'on-site' as const, label: 'On-site' },
]

export const VISA_COLORS = {
  yes: 'var(--success)',
  no: 'var(--danger)',
  unknown: 'var(--warning)',
} as const

export const VISA_OPTIONS = [
  { value: 'yes' as const, label: 'Yes', color: VISA_COLORS.yes },
  { value: 'no' as const, label: 'No', color: VISA_COLORS.no },
  { value: 'unknown' as const, label: 'Unknown', color: VISA_COLORS.unknown },
]
