import { Badge } from './Badge'
import { STATUS_CONFIG } from './statusConfig'
import type { ApplicationStatus } from '@/api/hooks/useApplications'

interface StatusBadgeProps {
  status: ApplicationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'var(--border-overlay)',
    fg: 'var(--foreground)',
  }

  return (
    <Badge bg={config.bg} color={config.fg} className="gap-1.5 ps-2">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ background: config.fg }}
      />
      {config.label}
    </Badge>
  )
}
