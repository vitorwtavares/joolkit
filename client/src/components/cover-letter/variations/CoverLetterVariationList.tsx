import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Check,
  Download,
  FilePlus,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  COVER_LETTER_VARIATION_LIMIT,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { PersistentScrollArea } from '@/components/ui/persistent-scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  COVER_LETTER_FALLBACK_LABEL,
  COVER_LETTER_LABEL_MAX_LENGTH,
  getCoverLetterFilename,
  getCoverLetterLabelValue,
} from './coverLetterVariationUtils'

interface CoverLetterVariationListProps {
  templates: CoverLetterTemplate[]
  activeVariation?: string | null
  locked?: boolean
  busy?: boolean
  isLoading?: boolean
  uploadingVariation?: string | null
  removingVariation?: string | null
  downloadingVariation?: string | null
  savingLabelVariation?: string | null
  downloadDisabled?: boolean
  skeletonRows?: number
  emptyDescription?: string
  onAdd: () => void
  /** When provided, the add affordance offers a choice between uploading a file
   *  and starting an empty variation from scratch (editor only). */
  onAddEmpty?: () => void
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

export function CoverLetterVariationList({
  templates,
  activeVariation,
  locked = false,
  busy = false,
  isLoading = false,
  uploadingVariation = null,
  removingVariation = null,
  downloadingVariation = null,
  savingLabelVariation = null,
  downloadDisabled = false,
  skeletonRows = 3,
  emptyDescription = `Add up to ${COVER_LETTER_VARIATION_LIMIT} variations. Each becomes a one-click download.`,
  onAdd,
  onAddEmpty,
  onSelect,
  onReplace,
  onRemove,
  onDownload,
  onRename,
  onLabelUpdated,
}: CoverLetterVariationListProps) {
  const labelInputRef = useRef<HTMLInputElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const variationRefs = useRef(new Map<string, HTMLDivElement>())
  const [editingVariation, setEditingVariation] = useState<string | null>(null)
  const [labelDraft, setLabelDraft] = useState('')

  const sortedTemplates = [...templates].sort((a, b) => a.position - b.position)
  const maxReached = sortedTemplates.length >= COVER_LETTER_VARIATION_LIMIT
  const addingNewVariation =
    uploadingVariation !== null &&
    !sortedTemplates.some(
      (template) => template.variation === uploadingVariation,
    )

  const prevTemplateCountRef = useRef(sortedTemplates.length)
  const hasSettledRef = useRef(false)
  const prevActiveVariationRef = useRef<string | null>(null)

  useEffect(() => {
    if (editingVariation === null) return
    const input = labelInputRef.current
    input?.focus()
    const cursorPosition = input?.value.length ?? 0
    input?.setSelectionRange(cursorPosition, cursorPosition)
  }, [editingVariation])

  // Marks the list as settled once data first arrives; after that, scrolls to
  // bottom when a new variation is added (count increases).
  useLayoutEffect(() => {
    const prevCount = prevTemplateCountRef.current
    prevTemplateCountRef.current = sortedTemplates.length

    if (!hasSettledRef.current) {
      if (sortedTemplates.length > 0) hasSettledRef.current = true
      return
    }

    if (sortedTemplates.length > prevCount) {
      const viewport = scrollViewportRef.current
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight - viewport.clientHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [sortedTemplates])

  // Scrolls the active variation into view whenever it changes — covers both
  // the initial URL-param load and runtime switches (e.g. sidebar navigation
  // that resets the URL and switches back to the first variation).
  useLayoutEffect(() => {
    const prevActive = prevActiveVariationRef.current
    prevActiveVariationRef.current = activeVariation ?? null

    if (!hasSettledRef.current) return
    if (!activeVariation || activeVariation === prevActive) return

    const row = variationRefs.current.get(activeVariation)
    const viewport = scrollViewportRef.current
    if (!row || !viewport) return

    const rowRect = row.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    if (rowRect.top < viewportRect.top) {
      viewport.scrollBy({
        top: rowRect.top - viewportRect.top,
        behavior: 'smooth',
      })
    } else if (rowRect.bottom > viewportRect.bottom) {
      viewport.scrollBy({
        top: rowRect.bottom - viewportRect.bottom,
        behavior: 'smooth',
      })
    }
  }, [activeVariation])

  function startLabelEdit(template: CoverLetterTemplate) {
    if (locked || busy) return
    setEditingVariation(template.variation)
    setLabelDraft(template.label || COVER_LETTER_FALLBACK_LABEL)
  }

  function cancelLabelEdit() {
    setEditingVariation(null)
    setLabelDraft('')
  }

  async function saveLabel(template: CoverLetterTemplate) {
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

  // Without onAddEmpty the trigger uploads directly; with it, the trigger opens
  // a menu to choose between uploading a file and starting from scratch.
  function renderAddAffordance(trigger: ReactNode) {
    if (!onAddEmpty) return trigger
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <DropdownMenuItem onSelect={onAdd}>
            <Upload />
            Upload a file
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onAddEmpty}>
            <FilePlus />
            Start from scratch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className="h-[62px] w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (sortedTemplates.length === 0) {
    return renderAddAffordance(
      <button
        type="button"
        disabled={locked || busy}
        onClick={onAddEmpty ? undefined : onAdd}
        className="flex h-full min-h-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-secondary px-4 py-6 text-center transition-colors hover:border-brand-border hover:bg-surface-selected disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-surface-selected text-text-faint">
          {uploadingVariation ? (
            <Loader2 size={18} className="animate-spin" />
          ) : onAddEmpty ? (
            <Plus size={20} />
          ) : (
            <Upload size={20} />
          )}
        </span>
        <span className="text-[13px] font-semibold text-foreground">
          {onAddEmpty ? 'Add a variation' : 'Upload a file'}
        </span>
        <span className="max-w-[28ch] text-[12px] text-text-faint">
          {emptyDescription}
        </span>
      </button>,
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PersistentScrollArea
        scrollViewportRef={scrollViewportRef}
        className="flex min-h-0 flex-1"
        viewportClassName="flex min-h-0 flex-1"
        contentClassName="flex min-h-0 flex-1 flex-col gap-2"
      >
        {sortedTemplates.map((template) => {
          const label = template.label || COVER_LETTER_FALLBACK_LABEL
          const filename = template.file_url
            ? getCoverLetterFilename(template.file_url)
            : 'No file uploaded'
          const active = template.variation === activeVariation
          const rowUploading = uploadingVariation === template.variation
          const rowRemoving = removingVariation === template.variation
          const rowDownloading = downloadingVariation === template.variation
          const rowSavingLabel = savingLabelVariation === template.variation
          const rowEditing = editingVariation === template.variation
          const rowBusy =
            rowUploading || rowRemoving || rowDownloading || rowSavingLabel
          const rowDisabled = locked || busy || rowBusy

          return (
            <div
              key={template.id}
              ref={(node) => {
                if (node) {
                  variationRefs.current.set(template.variation, node)
                } else {
                  variationRefs.current.delete(template.variation)
                }
              }}
              className={cn(
                'group/cover-row relative grid h-[62px] min-h-0 w-full shrink-0 grid-cols-[34px_1fr_auto] content-center items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-[background-color,border-color] hover:border-brand hover:bg-surface-selected',
                active && 'border-brand-border bg-surface-selected',
                (rowBusy || busy) && 'opacity-70',
              )}
            >
              <button
                type="button"
                aria-label={
                  onSelect ? `Select ${label}` : `Download ${filename}`
                }
                title={onSelect ? `Select ${label}` : `Download ${filename}`}
                disabled={
                  rowDisabled || rowEditing || (!onSelect && downloadDisabled)
                }
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
                {rowEditing ? (
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
                          void saveLabel(template)
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
                      onClick={() => void saveLabel(template)}
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
                            startLabelEdit(template)
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
        })}
      </PersistentScrollArea>

      <div className="flex-shrink-0 pt-2">
        {maxReached ? (
          <div className="px-2 py-1 text-center text-[11px] text-text-faint">
            Maximum of {COVER_LETTER_VARIATION_LIMIT} variations reached
          </div>
        ) : (
          renderAddAffordance(
            <button
              type="button"
              disabled={locked || busy}
              onClick={onAddEmpty ? undefined : onAdd}
              className="flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-60"
            >
              {addingNewVariation ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  Add variation
                  <span className="font-normal text-text-faint">
                    · {sortedTemplates.length}/{COVER_LETTER_VARIATION_LIMIT}
                  </span>
                </>
              )}
            </button>,
          )
        )}
      </div>
    </div>
  )
}
