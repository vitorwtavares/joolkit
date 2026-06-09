import type { ApplicationStatus } from '@/api/hooks/useApplications'

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; fg: string }
> = {
  prospect: {
    label: 'Prospect',
    bg: 'color-mix(in srgb, var(--palette-pink) 17%, transparent)',
    fg: 'var(--palette-pink)',
  },
  no_openings: {
    label: 'No openings',
    bg: 'color-mix(in srgb, var(--palette-gray) 17%, transparent)',
    fg: 'var(--palette-gray)',
  },
  ready_to_apply: {
    label: 'Ready to apply',
    bg: 'color-mix(in srgb, var(--palette-brown) 17%, transparent)',
    fg: 'var(--palette-brown)',
  },
  applied: {
    label: 'Applied',
    bg: 'color-mix(in srgb, var(--palette-orange) 17%, transparent)',
    fg: 'var(--palette-orange)',
  },
  pending_schedule: {
    label: 'Pending schedule',
    bg: 'color-mix(in srgb, var(--palette-default) 17%, transparent)',
    fg: 'var(--palette-default)',
  },
  interview_scheduled: {
    label: 'Interview scheduled',
    bg: 'color-mix(in srgb, var(--palette-blue) 17%, transparent)',
    fg: 'var(--palette-blue)',
  },
  awaiting_response: {
    label: 'Awaiting response',
    bg: 'color-mix(in srgb, var(--palette-yellow) 17%, transparent)',
    fg: 'var(--palette-yellow)',
  },
  technical_test: {
    label: 'Technical test',
    bg: 'color-mix(in srgb, var(--palette-purple) 17%, transparent)',
    fg: 'var(--palette-purple)',
  },
  offer_received: {
    label: 'Offer received',
    bg: 'color-mix(in srgb, var(--palette-green) 17%, transparent)',
    fg: 'var(--palette-green)',
  },
  rejected: {
    label: 'Rejected',
    bg: 'color-mix(in srgb, var(--palette-red) 17%, transparent)',
    fg: 'var(--palette-red)',
  },
  rejected_ghosted: {
    label: 'Rejected (ghosted)',
    bg: 'color-mix(in srgb, var(--palette-red) 17%, transparent)',
    fg: 'var(--palette-red)',
  },
  signed: {
    label: 'Signed',
    bg: 'color-mix(in srgb, var(--palette-green) 17%, transparent)',
    fg: 'var(--palette-green)',
  },
}
