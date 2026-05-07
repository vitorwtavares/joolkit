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
  }

  return <Badge bg={config.bg}>{config.label}</Badge>
}
