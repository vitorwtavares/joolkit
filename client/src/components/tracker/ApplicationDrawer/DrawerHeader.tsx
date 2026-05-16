import { ChevronsRight, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusCell } from '../cells/StatusCell'
import { CompanyNameEditor } from './CompanyNameEditor'
import { JobNameEditor } from './JobNameEditor'
import { getDaysInStage } from '@/utils/formatTimeInStage'
import { timeInStageColor } from '../styles'
import type { Application } from '@/api/hooks/useApplications'
import type { TrackerDraftHandle } from '../draft'

interface DrawerHeaderProps {
  app: Application
  draft: TrackerDraftHandle
  onClose: () => void
  onDeleteClick: () => void
}

export function DrawerHeader({
  app,
  draft,
  onClose,
  onDeleteClick,
}: DrawerHeaderProps) {
  const days = getDaysInStage(app.last_moved_at)

  return (
    <>
      {/* Top bar (fixed because header is outside the scroll container) */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-1">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close drawer"
        >
          <ChevronsRight size={22} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More options"
            >
              <MoreHorizontal size={22} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem variant="destructive" onClick={onDeleteClick}>
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Company name + status */}
      <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border-subtle px-16 pt-2 pb-4">
        <div className="flex flex-col">
          <CompanyNameEditor
            value={app.company_name || null}
            onSave={(v) => draft.apply({ company_name: v ?? '' })}
            onCommit={draft.flush}
          />
          <JobNameEditor
            value={app.job_name}
            onSave={(v) => draft.apply({ job_name: v })}
            onCommit={draft.flush}
          />
        </div>
        <div className="flex items-center gap-3">
          <StatusCell
            value={app.status}
            onSave={(v) => draft.apply({ status: v })}
            inline
          />
          <span className={`text-[13px] ${timeInStageColor(days)}`}>
            {days === 1 ? '1 day in stage' : `${days} days in stage`}
          </span>
        </div>
      </div>
    </>
  )
}
