import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useCopiedBubble } from '@/hooks/useCopiedBubble'
import { useUpdateAnswer } from '@/api/hooks/useAnswers'
import type { Answer } from '@/api/hooks/useAnswers'

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

  function handleVariantChange(variant: 'short' | 'long', e: React.MouseEvent) {
    e.stopPropagation()
    setLocalVariant(variant)
    updateAnswer.mutate({ id: answer.id, preferred_variant: variant })
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
          'flex h-[52px] w-full items-center rounded-lg border border-border bg-card transition-colors',
          !isDragging && 'hover:bg-secondary/30',
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
          className="flex h-full flex-1 cursor-pointer items-center gap-3 rounded-r-lg pr-5 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="min-w-[16px] text-center text-[12px] text-muted-foreground">
            {position}
          </span>
          <span className="flex-1 truncate text-[14px] text-foreground">
            {answer.question || (
              <span className="text-muted-foreground italic">No question</span>
            )}
          </span>
          {hasBothVariants && (
            <div
              className="flex flex-shrink-0 gap-[1px] rounded-full border border-border/60 bg-secondary p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleVariantChange('short', e)}
                className={cn(
                  'cursor-pointer rounded-full px-2.5 py-[3px] text-[11px] transition-colors',
                  effectiveVariant === 'short'
                    ? 'bg-secondary-foreground/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Default
              </button>
              <button
                onClick={(e) => handleVariantChange('long', e)}
                className={cn(
                  'cursor-pointer rounded-full px-2.5 py-[3px] text-[11px] transition-colors',
                  effectiveVariant === 'long'
                    ? 'bg-secondary-foreground/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Detailed
              </button>
            </div>
          )}
          <span className="flex-shrink-0 text-[12px] text-muted-foreground/50">
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
        className="absolute top-1/2 -right-[11px] z-10 flex size-[22px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary"
      >
        <Pencil size={11} className="text-muted-foreground" />
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
        className="group flex h-[52px] w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-card px-5 hover:border-border/80"
      >
        <span className="min-w-[16px] text-center text-[12px] text-muted-foreground">
          {position}
        </span>
        <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground/50 transition-colors duration-200 group-hover:text-muted-foreground">
          <Plus size={14} />
          Add answer
        </span>
      </button>
    </div>
  )
}
