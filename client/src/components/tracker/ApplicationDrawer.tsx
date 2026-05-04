import { X } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { getDaysInStage } from '@/utils/formatTimeInStage'
import type { Application } from '@/api/hooks/useApplications'

interface ApplicationDrawerProps {
  app: Application
  onClose: () => void
}

export function ApplicationDrawer({ app, onClose }: ApplicationDrawerProps) {
  const days = getDaysInStage(app.last_moved_at)

  return (
    <div className="flex w-[700px] flex-shrink-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.07)] px-6 py-5">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[30px] leading-tight font-semibold">
            {app.company_name || (
              <span className="text-muted-foreground">Untitled</span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <StatusBadge status={app.status} />
            <span className="text-[13px] text-muted-foreground">
              {days === 1 ? '1 day in stage' : `${days} days in stage`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground"
          aria-label="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" />
    </div>
  )
}
