import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCopiedBubble } from '@/hooks/useCopiedBubble'
import { useUpdateAnswer } from '@/api/hooks/useAnswers'
import type { Answer } from '@/api/hooks/useAnswers'

interface AnswerEntryProps {
  position: number
  answer: Answer | null
  onAdd: () => void
  onEdit: (answer: Answer) => void
}

export function AnswerEntry({
  position,
  answer,
  onAdd,
  onEdit,
}: AnswerEntryProps) {
  const { trigger: triggerCopied, bubble: copiedBubble } = useCopiedBubble()
  const updateAnswer = useUpdateAnswer()
  const [localVariant, setLocalVariant] = useState<'short' | 'long' | null>(
    null,
  )

  useEffect(() => {
    setLocalVariant(null)
  }, [answer?.id])

  const effectiveVariant = localVariant ?? answer?.preferred_variant ?? 'short'
  const hasBothVariants = !!answer?.long_answer?.trim()

  async function handleCopy() {
    if (!answer) return
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
    if (!answer) return
    setLocalVariant(variant)
    updateAnswer.mutate({ id: answer.id, preferred_variant: variant })
  }

  if (!answer) {
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

  return (
    <div className="relative">
      {copiedBubble}
      <button
        onClick={handleCopy}
        className="flex h-[52px] w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-5 text-left transition-colors hover:bg-secondary/30"
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
      </button>
      <button
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
