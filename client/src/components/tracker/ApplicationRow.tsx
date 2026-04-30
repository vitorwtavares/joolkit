import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TextCell } from './cells/TextCell'
import { StatusCell } from './cells/StatusCell'
import { EnumCell } from './cells/EnumCell'
import { DateCell } from './cells/DateCell'
import { LocationCell } from './cells/LocationCell'
import { SkillsCell } from './cells/SkillsCell'
import { EmptyCell } from './cells/EmptyCell'
import { CareerUrlButton } from './CareerUrlButton'
import {
  useUpdateApplication,
  useDeleteApplication,
} from '@/api/hooks/useApplications'
import { formatTimeInStage, getDaysInStage } from '@/utils/formatTimeInStage'
import { TD, FIRST_COL_PL } from './styles'
import type {
  Application,
  ApplicationStatus,
  CreateApplicationPayload,
} from '@/api/hooks/useApplications'

function timeInStageColor(days: number) {
  if (days > 45) return 'text-[#f09595]'
  if (days > 30) return 'text-[#f0c040]'
  return 'text-foreground'
}

const WORK_STYLE_OPTIONS = [
  { value: 'remote' as const, label: 'Remote' },
  { value: 'hybrid' as const, label: 'Hybrid' },
  { value: 'on-site' as const, label: 'On-site' },
]

const VISA_COLORS = {
  yes: '#7dd4a0',
  no: '#f09595',
  unknown: '#fbbf24',
} as const

const VISA_OPTIONS = [
  { value: 'yes' as const, label: 'Yes', color: VISA_COLORS.yes },
  { value: 'no' as const, label: 'No', color: VISA_COLORS.no },
  { value: 'unknown' as const, label: 'Unknown', color: VISA_COLORS.unknown },
]

interface ApplicationRowProps {
  app: Application
}

export function ApplicationRow({ app }: ApplicationRowProps) {
  const { mutate: update } = useUpdateApplication()
  const { mutate: deleteApp } = useDeleteApplication()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function save(fields: CreateApplicationPayload) {
    update(
      { id: app.id, ...fields },
      { onError: () => toast.error('Failed to save') },
    )
  }

  function handleDelete() {
    deleteApp(app.id, { onError: () => toast.error('Failed to delete') })
  }

  const visaColor = app.visa_support ? VISA_COLORS[app.visa_support] : undefined

  return (
    <>
      <tr className="group hover:bg-[rgba(255,255,255,0.02)]">
        {/* Favorite + delete */}
        <td className={`${TD} ${FIRST_COL_PL} relative`}>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
            aria-label="Delete application"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => save({ is_favorite: !app.is_favorite })}
            className="cursor-pointer rounded p-0.5 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <Star
              size={14}
              className={
                app.is_favorite
                  ? 'fill-[#EF9F27] text-[#EF9F27]'
                  : 'text-muted-foreground/30'
              }
            />
          </button>
        </td>

        {/* Company */}
        <td className={`${TD} relative`} style={{ padding: 0 }}>
          <TextCell
            value={app.company_name || null}
            bold
            className="pr-8"
            onSave={(v) => save({ company_name: v ?? '' })}
          />
          <CareerUrlButton
            url={app.careers_url}
            onSave={(url) => save({ careers_url: url })}
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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {app.company_name
                ? `This will permanently remove ${app.company_name} from your tracker.`
                : 'This will permanently remove this application from your tracker.'}{' '}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
