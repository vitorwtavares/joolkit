import { memo, useState } from 'react'
import { Star, Trash2, PanelRightOpen, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TextCell } from './cells/TextCell'
import { StatusCell } from './cells/StatusCell'
import { EnumCell } from './cells/EnumCell'
import { DateCell } from './cells/DateCell'
import { LocationCell } from './cells/LocationCell'
import { SkillsCell } from './cells/SkillsCell'
import { EmptyCell } from './cells/EmptyCell'
import { LabelUrlButton } from './LabelUrlButton'
import { DeleteApplicationDialog } from './DeleteApplicationDialog'
import { useDeleteApplication } from '@/api/hooks/useApplications'
import { useResolvedApp, useTrackerDraft } from './draft'
import { formatTimeInStage, getDaysInStage } from '@/utils/formatTimeInStage'
import { TD, FIRST_COL_PL, timeInStageColor } from './styles'
import { WORK_STYLE_OPTIONS, VISA_OPTIONS, VISA_COLORS } from './enumOptions'
import type {
  Application,
  ApplicationStatus,
} from '@/api/hooks/useApplications'

interface ApplicationRowProps {
  app: Application
  isSelected: boolean
  onRowClick: (id: string) => void
  onDeleteSelected?: () => void
}

function ApplicationRowImpl({
  app: serverApp,
  isSelected,
  onRowClick,
  onDeleteSelected,
}: ApplicationRowProps) {
  const app = useResolvedApp(serverApp)
  const draft = useTrackerDraft(app.id)
  const save = draft.apply
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function openDrawer() {
    onRowClick(app.id)
  }

  function handleDelete() {
    deleteApp(app.id, {
      onSuccess: () => {
        draft.clear()
        setConfirmDelete(false)
        if (isSelected) onDeleteSelected?.()
      },
      onError: () => {
        toast.error('Failed to delete')
        setConfirmDelete(false)
      },
    })
  }

  const visaColor = app.visa_support ? VISA_COLORS[app.visa_support] : undefined

  return (
    <>
      <tr
        className={cn(
          'group',
          isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover-ghost',
        )}
      >
        {/* Favorite + delete */}
        <td className={`${TD} ${FIRST_COL_PL} relative`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:text-foreground data-[state=open]:text-foreground data-[state=open]:opacity-100"
                aria-label="Row actions"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={openDrawer}>
                <PanelRightOpen size={14} />
                Open details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => save({ is_favorite: !app.is_favorite })}
            className="cursor-pointer rounded p-0.5 transition-colors hover:bg-muted"
          >
            <Star
              size={15}
              className={
                app.is_favorite
                  ? 'fill-warning-accent text-warning-accent'
                  : 'text-muted-foreground/30'
              }
            />
          </button>
        </td>

        {/* Company */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <TextCell
            value={app.company_name || null}
            url={app.careers_url}
            bold
            className="pl-9"
            maxLength={50}
            onSave={(v) => save({ company_name: v ?? '' })}
          />
          <LabelUrlButton
            url={app.careers_url}
            onSave={(url) => save({ careers_url: url })}
            label={app.company_name || null}
            onSaveLabel={(v) => save({ company_name: v ?? '' })}
          />
          <button
            type="button"
            onClick={openDrawer}
            className="absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer items-center rounded border border-border-overlay bg-secondary px-1.5 py-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:border-border-overlay-strong hover:text-foreground"
            aria-label="Open details"
          >
            <PanelRightOpen size={15} />
          </button>
        </td>

        {/* Job title */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <TextCell
            value={app.job_name}
            url={app.job_url}
            className="pl-9"
            maxLength={100}
            onSave={(v) => save({ job_name: v })}
          />
          <LabelUrlButton
            url={app.job_url}
            onSave={(url) => save({ job_url: url })}
            label={app.job_name}
            onSaveLabel={(v) => save({ job_name: v })}
            labelTitle="Job title"
            urlTitle="Job posting link"
          />
        </td>

        {/* Status */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <StatusCell
            value={app.status}
            onSave={(v: ApplicationStatus) => save({ status: v })}
          />
        </td>

        {/* Location */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <LocationCell
            value={app.location}
            onSave={(locationId) => save({ location_id: locationId })}
          />
        </td>

        {/* Salary */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <TextCell value={app.salary} onSave={(v) => save({ salary: v })} />
        </td>

        {/* Work style */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <EnumCell
            value={app.work_style}
            options={WORK_STYLE_OPTIONS}
            onSave={(v) => save({ work_style: v })}
          />
        </td>

        {/* Visa */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <EnumCell
            value={app.visa_support}
            options={VISA_OPTIONS}
            renderDisplay={(v) =>
              v == null ? (
                <EmptyCell />
              ) : (
                <span style={{ color: visaColor }}>
                  {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unknown'}
                </span>
              )
            }
            onSave={(v) => save({ visa_support: v })}
          />
        </td>

        {/* Date applied */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <DateCell
            value={app.date_applied}
            onSave={(v) => save({ date_applied: v })}
          />
        </td>

        {/* Time in stage (read-only) */}
        <td
          className={`${TD} ${timeInStageColor(getDaysInStage(app.last_moved_at))}`}
        >
          {formatTimeInStage(app.last_moved_at)}
        </td>

        {/* Skills */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <SkillsCell
            value={app.skills ?? []}
            onSave={(skillIds) => save({ skill_ids: skillIds })}
          />
        </td>
      </tr>

      <DeleteApplicationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        companyName={app.company_name || null}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  )
}

export const ApplicationRow = memo(ApplicationRowImpl)
