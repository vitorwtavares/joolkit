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
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { cn } from '@/lib/utils'
import {
  COVER_LETTER_FALLBACK_LABEL,
  COVER_LETTER_LABEL_MAX_LENGTH,
  getCoverLetterFilename,
  getCoverLetterLabelValue,
} from './coverLetterVariationUtils'

interface VariationRowProps {
  template: CoverLetterTemplate
  active: boolean
  rowUploading: boolean
  rowRemoving: boolean
  rowDownloading: boolean
  rowSavingLabel: boolean
  locked: boolean
  busy: boolean
  downloadDisabled: boolean
  rowRef: (node: HTMLDivElement | null) => void
  onSelect?: (template: CoverLetterTemplate) => void
  onReplace?: (template: CoverLetterTemplate) => void
  onRemove: (template: CoverLetterTemplate) => void
  onDownload?: (template: CoverLetterTemplate) => void
  onRename?: (template: CoverLetterTemplate) => void
  onLabelUpdated?: (
    template: CoverLetterTemplate,
    label: string,
  ) => Promise<void> | void
}

export function VariationRow({
  template,
  active,
  rowUploading,
  rowRemoving,
  rowDownloading,
  rowSavingLabel,
  locked,
  busy,
  downloadDisabled,
  rowRef,
  onSelect,
  onReplace,
  onRemove,
  onDownload,
  onRename,
  onLabelUpdated,
}: VariationRowProps) {
  const labelInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')

  const label = template.label || COVER_LETTER_FALLBACK_LABEL
  const filename = template.file_url
    ? getCoverLetterFilename(template.file_url)
    : 'No file uploaded'
  const rowBusy =
    rowUploading || rowRemoving || rowDownloading || rowSavingLabel
  const rowDisabled = locked || busy || rowBusy

  useEffect(() => {
    if (!isEditing) return
    const input = labelInputRef.current
    input?.focus()
    const cursorPosition = input?.value.length ?? 0
    input?.setSelectionRange(cursorPosition, cursorPosition)
  }, [isEditing])

  function startLabelEdit() {
    if (locked || busy) return
    setIsEditing(true)
    setLabelDraft(template.label || COVER_LETTER_FALLBACK_LABEL)
  }

  function cancelLabelEdit() {
    setIsEditing(false)
    setLabelDraft('')
  }

  async function saveLabel() {
    const nextLabel = getCoverLetterLabelValue(labelDraft)
    if (!nextLabel) {
      cancelLabelEdit()
      return
    }
    try {
      await onLabelUpdated?.(template, nextLabel)
      cancelLabelEdit()
    } catch {
      // Parent mutation owns feedback; keep the editor open for correction.
    }
  }

  return (
    <div
      ref={rowRef}
      className={cn(
        'group/cover-row relative grid h-[62px] min-h-0 w-full shrink-0 grid-cols-[34px_1fr_auto] content-center items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-[background-color,border-color] hover:border-brand hover:bg-surface-selected',
        active && 'border-brand-border bg-surface-selected',
        (rowBusy || busy) && 'opacity-70',
      )}
    >
      <button
        type="button"
        aria-label={onSelect ? `Select ${label}` : `Download ${filename}`}
        title={onSelect ? `Select ${label}` : `Download ${filename}`}
        disabled={rowDisabled || isEditing || (!onSelect && downloadDisabled)}
        onClick={() => {
          if (onSelect) {
            onSelect(template)
          } else {
            onDownload?.(template)
          }
        }}
        className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-border disabled:cursor-default"
      />
      <span className="pointer-events-none relative z-10 flex size-[34px] items-center justify-center rounded-lg bg-brand-soft text-brand">
        {rowUploading || rowRemoving || rowDownloading ? (
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
              maxLength={COVER_LETTER_LABEL_MAX_LENGTH}
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
              aria-label="Save cover letter label"
              disabled={rowSavingLabel}
              onClick={() => void saveLabel()}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-success-soft-strong text-success transition-colors hover:bg-success/25 disabled:pointer-events-none disabled:opacity-50"
            >
              {rowSavingLabel ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              type="button"
              aria-label="Cancel cover letter label edit"
              disabled={rowSavingLabel}
              onClick={cancelLabelEdit}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-danger-soft-fill text-danger transition-colors hover:bg-danger/25 disabled:pointer-events-none disabled:opacity-50"
            >
              <X size={12} />
            </button>
          </span>
        ) : (
          <span className="flex h-7 min-w-0 items-center gap-0.5">
            <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
              {label}
            </span>
            {!locked && (onRename || onLabelUpdated) && (
              <button
                type="button"
                aria-label={`Edit ${label} label`}
                title="Edit label"
                disabled={rowDisabled}
                onClick={() => {
                  if (onRename) {
                    onRename(template)
                  } else {
                    startLabelEdit()
                  }
                }}
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
        {onSelect ? (
          onDownload && (
            <button
              type="button"
              aria-label={`Download ${label}`}
              title="Download"
              disabled={rowDisabled || downloadDisabled}
              onClick={() => onDownload(template)}
              className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
            >
              <Download size={15} />
            </button>
          )
        ) : (
          <span className="flex size-[30px] items-center justify-center rounded-md text-text-faint transition-colors group-hover/cover-row:bg-brand-soft group-hover/cover-row:text-brand">
            <Download size={15} />
          </span>
        )}
        {onReplace && (
          <button
            type="button"
            aria-label={`Replace ${label}`}
            title="Replace file"
            disabled={rowDisabled}
            onClick={() => onReplace(template)}
            className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCcw size={15} />
          </button>
        )}
        <button
          type="button"
          aria-label={`Remove ${label}`}
          title="Remove"
          disabled={rowDisabled}
          onClick={() => onRemove(template)}
          className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-danger-soft-fill hover:text-danger disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </span>
    </div>
  )
}
