import type { ApplicationStatus } from '@/api/hooks/useApplications'

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string }
> = {
  prospect: { label: 'Prospect', bg: 'var(--palette-pink)' },
  no_openings: { label: 'No openings', bg: 'var(--palette-gray)' },
  ready_to_apply: { label: 'Ready to apply', bg: 'var(--palette-brown)' },
  applied: { label: 'Applied', bg: 'var(--palette-orange)' },
  pending_schedule: { label: 'Pending schedule', bg: 'var(--palette-gray)' },
  interview_scheduled: {
    label: 'Interview scheduled',
    bg: 'var(--palette-blue)',
  },
  awaiting_response: {
    label: 'Awaiting response',
    bg: 'var(--palette-yellow)',
  },
  technical_test: { label: 'Technical test', bg: 'var(--palette-purple)' },
  offer_received: { label: 'Offer received', bg: 'var(--palette-green)' },
  rejected: { label: 'Rejected', bg: 'var(--palette-red)' },
  rejected_ghosted: { label: 'Rejected (ghosted)', bg: 'var(--palette-red)' },
  signed: { label: 'Signed', bg: 'var(--palette-green)' },
}
