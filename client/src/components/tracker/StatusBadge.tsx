import type { ApplicationStatus } from '@/api/hooks/useApplications'

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; color: string }
> = {
  prospect: {
    label: 'Prospect',
    bg: 'rgba(147,113,255,0.12)',
    color: '#c4b0ff',
  },
  no_openings: {
    label: 'No openings',
    bg: 'rgba(90,90,86,0.15)',
    color: '#8a8a85',
  },
  ready_to_apply: {
    label: 'Ready to apply',
    bg: 'rgba(147,113,255,0.08)',
    color: '#a898e8',
  },
  applied: {
    label: 'Applied',
    bg: 'rgba(56,142,210,0.12)',
    color: '#85B7EB',
  },
  pending_schedule: {
    label: 'Pending schedule',
    bg: 'rgba(90,90,86,0.20)',
    color: '#8a8a85',
  },
  interview_scheduled: {
    label: 'Interview scheduled',
    bg: 'rgba(97,194,127,0.12)',
    color: '#7dd4a0',
  },
  awaiting_response: {
    label: 'Awaiting response',
    bg: 'rgba(90,90,86,0.20)',
    color: '#8a8a85',
  },
  technical_test: {
    label: 'Technical test',
    bg: 'rgba(239,159,39,0.10)',
    color: '#c8902a',
  },
  offer_received: {
    label: 'Offer received',
    bg: 'rgba(239,159,39,0.12)',
    color: '#EF9F27',
  },
  rejected: {
    label: 'Rejected',
    bg: 'rgba(220,80,80,0.12)',
    color: '#f09595',
  },
  rejected_ghosted: {
    label: 'Rejected (ghosted)',
    bg: 'rgba(220,80,80,0.12)',
    color: '#f09595',
  },
  signed: {
    label: 'Signed',
    bg: 'rgba(97,194,127,0.18)',
    color: '#7dd4a0',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'rgba(90,90,86,0.15)',
    color: '#8a8a85',
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[14px] font-medium whitespace-nowrap"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
