import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useCopiedBubble } from '@/hooks/useCopiedBubble'
import { useUpdateAnswer } from '@/api/hooks/useAnswers'
import type { Answer } from '@/api/hooks/useAnswers'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'

interface AnswerEntryProps {
  position: number
  answer: Answer
  onEdit: (answer: Answer) => void
}

export function AnswerEntry({ position, answer, onEdit }: AnswerEntryProps) {
  const { trigger: triggerCopied, bubble: copiedBubble } = useCopiedBubble()
  const updateAnswer = useUpdateAnswer()
  const [localVariant, setLocalVariant] = useState<'short' | 'long' | null>(
    null,
  )

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: answer.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalVariant(null)
  }, [answer.id])

  const effectiveVariant = localVariant ?? answer.preferred_variant ?? 'short'
  const hasBothVariants = !!answer.long_answer?.trim()

  async function handleCopy() {
    const text =
      effectiveVariant === 'long' && answer.long_answer
        ? answer.long_answer
        : answer.short_answer
    if (!text?.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      triggerCopied()
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group/row relative', isDragging && 'z-20 opacity-60')}
    >
      {copiedBubble}
      <div
        className={cn(
          'flex h-[56px] w-full items-center rounded-lg border border-border bg-secondary transition-colors',
          !isDragging && 'hover:bg-secondary/70',
        )}
      >
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-full cursor-grab items-center rounded-l-lg pr-1 pl-2 text-muted-foreground/40 opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-muted-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCopy()
            }
          }}
          className="flex h-full flex-1 cursor-pointer items-center gap-2 rounded-r-lg pr-5 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="min-w-[16px] text-center text-[13px] text-muted-foreground">
            {position}
          </span>
          <span className="max-w-[530px] min-w-0 flex-1 truncate text-[15px] text-foreground">
            {answer.question || (
              <span className="text-muted-foreground italic">No question</span>
            )}
          </span>
          {hasBothVariants && (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <SegmentedToggle
                value={effectiveVariant}
                onChange={(variant) => {
                  setLocalVariant(variant)
                  updateAnswer.mutate({
                    id: answer.id,
                    preferred_variant: variant,
                  })
                }}
                options={[
                  { label: 'Default', value: 'short' },
                  { label: 'Detailed', value: 'long' },
                ]}
                variant="compact"
                className="border-border/60 p-0.5"
              />
            </div>
          )}
          <span className="ml-1 flex-shrink-0 text-[13px] text-muted-foreground/70">
            Click to copy
          </span>
        </div>
      </div>
      <button
        aria-label="Edit answer"
        onClick={(e) => {
          e.stopPropagation()
          onEdit(answer)
        }}
        className="absolute top-1/2 -right-[11px] z-10 flex size-[24px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary shadow-sm transition-colors hover:bg-surface-selected"
      >
        <Pencil size={13} className="text-muted-foreground" />
      </button>
    </div>
  )
}

interface EmptyAnswerEntryProps {
  position: number
  onAdd: () => void
}

export function EmptyAnswerEntry({ position, onAdd }: EmptyAnswerEntryProps) {
  return (
    <div className="relative">
      <button
        onClick={onAdd}
        className="group flex h-[56px] w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-secondary px-5 transition-colors hover:border-border/80 hover:bg-secondary/70"
      >
        <span className="min-w-[16px] text-center text-[13px] text-muted-foreground">
          {position}
        </span>
        <span className="flex items-center gap-1.5 text-[15px] text-muted-foreground/50 transition-colors duration-200 group-hover:text-muted-foreground">
          <Plus size={14} />
          Add answer
        </span>
      </button>
    </div>
  )
}
