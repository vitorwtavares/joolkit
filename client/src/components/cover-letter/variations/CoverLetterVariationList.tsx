import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { FilePlus, Loader2, Plus, Upload } from 'lucide-react'
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { FREE_COVER_LETTER_VARIATION_LIMIT } from '@/components/billing/planData'
import { UpgradeCTA } from '@/components/billing/UpgradeCTA'
import { PersistentScrollArea } from '@/components/ui/persistent-scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { VariationRow } from './VariationRow'

interface CoverLetterVariationListProps {
  templates: CoverLetterTemplate[]
  activeVariation?: string | null
  locked?: boolean
  busy?: boolean
  isLoading?: boolean
  planLoading?: boolean
  uploadingVariation?: string | null
  removingVariation?: string | null
  downloadingVariation?: string | null
  savingLabelVariation?: string | null
  downloadDisabled?: boolean
  skeletonRows?: number
  emptyDescription?: string
  // Effective plan cap. When the user is at the cap and `onUpgrade` is provided
  // (Free), the add affordance becomes an upgrade prompt instead of a hard stop.
  limit?: number
  onUpgrade?: () => void
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
  planLoading = false,
  uploadingVariation = null,
  removingVariation = null,
  downloadingVariation = null,
  savingLabelVariation = null,
  downloadDisabled = false,
  skeletonRows = 3,
  limit = FREE_COVER_LETTER_VARIATION_LIMIT,
  onUpgrade,
  emptyDescription = `Add up to ${limit} variations. Each becomes a one-click download.`,
  onAdd,
  onAddEmpty,
  onSelect,
  onReplace,
  onRemove,
  onDownload,
  onRename,
  onLabelUpdated,
}: CoverLetterVariationListProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const variationRefs = useRef(new Map<string, HTMLDivElement>())

  const sortedTemplates = [...templates].sort((a, b) => a.position - b.position)
  const maxReached = !planLoading && sortedTemplates.length >= limit
  const canUpgrade = maxReached && !!onUpgrade
  const addingNewVariation =
    uploadingVariation !== null &&
    !sortedTemplates.some(
      (template) => template.variation === uploadingVariation,
    )

  const prevTemplateCountRef = useRef(sortedTemplates.length)
  const hasSettledRef = useRef(false)
  const prevActiveVariationRef = useRef<string | null>(null)

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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PersistentScrollArea
        scrollViewportRef={scrollViewportRef}
        className="flex min-h-0 flex-1"
        viewportClassName="flex min-h-0 flex-1"
        contentClassName="flex min-h-0 flex-1 flex-col gap-2"
        fadeEdges
      >
        {sortedTemplates.map((template) => (
          <VariationRow
            key={template.id}
            template={template}
            active={template.variation === activeVariation}
            rowUploading={uploadingVariation === template.variation}
            rowRemoving={removingVariation === template.variation}
            rowDownloading={downloadingVariation === template.variation}
            rowSavingLabel={savingLabelVariation === template.variation}
            locked={locked}
            busy={busy}
            downloadDisabled={downloadDisabled}
            rowRef={(node) => {
              if (node) {
                variationRefs.current.set(template.variation, node)
              } else {
                variationRefs.current.delete(template.variation)
              }
            }}
            onSelect={onSelect}
            onReplace={onReplace}
            onRemove={onRemove}
            onDownload={onDownload}
            onRename={onRename}
            onLabelUpdated={onLabelUpdated}
          />
        ))}
      </PersistentScrollArea>

      <div className="mt-auto shrink-0 pt-2 pb-2">
        {planLoading ? (
          <Skeleton className="h-[41px] w-full rounded-lg" />
        ) : canUpgrade ? (
          <UpgradeCTA
            label="Upgrade for more variations"
            onClick={() => onUpgrade?.()}
          />
        ) : maxReached ? (
          <div className="px-2 py-1 text-center text-[11px] text-text-faint">
            Maximum of {limit} variations reached
          </div>
        ) : (
          renderAddAffordance(
            <button
              type="button"
              disabled={locked || busy || planLoading}
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
                    · {sortedTemplates.length}/{limit}
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
