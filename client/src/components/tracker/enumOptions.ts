export const WORK_STYLE_OPTIONS = [
  { value: 'remote' as const, label: 'Remote' },
  { value: 'hybrid' as const, label: 'Hybrid' },
  { value: 'on-site' as const, label: 'On-site' },
]

export const VISA_COLORS = {
  yes: '#7dd4a0',
  no: '#f09595',
  unknown: '#fbbf24',
} as const

export const VISA_OPTIONS = [
  { value: 'yes' as const, label: 'Yes', color: VISA_COLORS.yes },
  { value: 'no' as const, label: 'No', color: VISA_COLORS.no },
  { value: 'unknown' as const, label: 'Unknown', color: VISA_COLORS.unknown },
]
