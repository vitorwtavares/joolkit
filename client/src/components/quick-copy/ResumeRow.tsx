import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Download,
  FileText,
  Loader2,
  Pencil,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react'
import type { ResumeVariation } from '@/api/hooks/useResumes'
import { cn } from '@/lib/utils'

function getFilename(path: string): string {
  return path.split('/').pop() ?? path
}

function getFallbackLabel(): string {
  return 'Resume'
}

interface ResumeRowProps {
  resume: ResumeVariation
  locked: boolean
  busy: boolean
  rowUploading: boolean
  rowRemoving: boolean
  isOnCooldown: boolean
  iconPop: boolean
  onIconPopEnd: () => void
  onDownload: (resume: ResumeVariation) => void
  onReplace: (position: number, label: string, id: string) => void
  onRemove: (resume: ResumeVariation) => void
  onLabelUpdated: (resumeId: string, label: string) => Promise<void> | void
}

export function ResumeRow({
  resume,
  locked,
  busy,
  rowUploading,
  rowRemoving,
  isOnCooldown,
  iconPop,
  onIconPopEnd,
  onDownload,
  onReplace,
  onRemove,
  onLabelUpdated,
}: ResumeRowProps) {
  const labelInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [isSavingLabel, setIsSavingLabel] = useState(false)

  const label = resume.label || getFallbackLabel()
  const filename = getFilename(resume.file_url)
  const rowBusy = rowUploading || rowRemoving || isSavingLabel

  useEffect(() => {
    if (!isEditing) return
    const input = labelInputRef.current
    input?.focus()
    const cursorPosition = input?.value.length ?? 0
    input?.setSelectionRange(cursorPosition, cursorPosition)
  }, [isEditing])

  function startLabelEdit() {
    if (locked || busy || rowBusy) return
    setIsEditing(true)
    setLabelDraft(label)
  }

  function cancelLabelEdit() {
    setIsEditing(false)
    setLabelDraft('')
  }

  async function saveLabel() {
    const nextLabel = labelDraft.trim()
    if (!nextLabel) {
      cancelLabelEdit()
      return
    }
    setIsSavingLabel(true)
    try {
      await onLabelUpdated(resume.id, nextLabel)
      cancelLabelEdit()
    } catch {
      // Parent shows the toast; keep the editor open for correction/retry.
    } finally {
      setIsSavingLabel(false)
    }
  }

  return (
    <div
      className={cn(
        'group/resume-row relative grid h-[62px] min-h-0 w-full shrink-0 grid-cols-[34px_1fr_auto] content-center items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-[background-color,border-color] hover:border-brand hover:bg-surface-selected',
        (rowBusy || busy) && 'opacity-70',
      )}
    >
      <button
        type="button"
        aria-label={`Download ${filename}`}
        title={`Download ${filename}`}
        disabled={busy || rowBusy || isOnCooldown || isEditing}
        onClick={() => void onDownload(resume)}
        className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-border disabled:cursor-default"
      />
      <span
        className={cn(
          'pointer-events-none relative z-10 flex size-[34px] items-center justify-center rounded-lg bg-brand-soft text-brand',
          iconPop && 'animate-icon-pop',
        )}
        onAnimationEnd={onIconPopEnd}
      >
        {rowUploading || rowRemoving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileText size={16} />
        )}
      </span>
      <span className="pointer-events-none relative z-10 min-w-0">
        {isEditing ? (
          <span className="pointer-events-auto flex h-7 max-w-[275px] min-w-0 items-center gap-1.5">
            <input
              ref={labelInputRef}
              value={labelDraft}
              autoComplete="off"
              aria-label={`Rename ${label}`}
              onChange={(event) => setLabelDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void saveLabel()
                }
                if (event.key === 'Escape') {
                  cancelLabelEdit()
                }
              }}
              className="h-7 min-w-0 flex-1 rounded-[5px] border border-brand-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-brand-border/50"
            />
            <button
              type="button"
              aria-label="Save resume label"
              disabled={isSavingLabel}
              onClick={() => void saveLabel()}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-success-soft-strong text-success transition-colors hover:bg-success/25 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSavingLabel ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              type="button"
              aria-label="Cancel resume label edit"
              disabled={isSavingLabel}
              onClick={cancelLabelEdit}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-danger-soft-fill text-danger transition-colors hover:bg-danger/25 disabled:pointer-events-none disabled:opacity-50"
            >
              <X size={12} />
            </button>
          </span>
        ) : (
          <span className="flex h-7 min-w-0 items-center gap-1">
            <span className="block truncate text-[13px] font-semibold text-foreground">
              {label}
            </span>
            {!locked && (
              <button
                type="button"
                aria-label={`Edit ${label} label`}
                title="Edit label"
                disabled={busy || rowBusy}
                onClick={startLabelEdit}
                className="pointer-events-auto flex size-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
              >
                <Pencil size={11} strokeWidth={2.4} />
              </button>
            )}
          </span>
        )}
        <span className="mt-0.5 block truncate text-[12px] text-text-faint">
          {filename}
        </span>
      </span>
      <span className="pointer-events-none relative z-10 flex items-center gap-1">
        <span className="flex size-[30px] items-center justify-center rounded-md text-text-faint transition-colors group-hover/resume-row:bg-brand-soft group-hover/resume-row:text-brand">
          <Download size={15} />
        </span>
        <button
          type="button"
          aria-label={`Replace ${label}`}
          title="Replace file"
          disabled={locked || busy || rowBusy}
          onClick={() => onReplace(resume.position, label, resume.id)}
          className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCcw size={15} />
        </button>
        <button
          type="button"
          aria-label={`Remove ${label}`}
          title="Remove"
          disabled={locked || busy || rowBusy}
          onClick={() => onRemove(resume)}
          className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-danger-soft-fill hover:text-danger disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </span>
    </div>
  )
}
