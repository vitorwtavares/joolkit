import { Pencil } from 'lucide-react'
import type { Answer } from '@/api/hooks/useAnswers'
import { Snippet } from './Snippet'

interface AnswerCardProps {
  answer: Answer
  onEdit: (answer: Answer) => void
}

function formatEditedDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function AnswerCard({ answer, onEdit }: AnswerCardProps) {
  const edited = formatEditedDate(answer.updated_at)

  return (
    <article className="group/card relative flex min-h-[196px] flex-col rounded-[10px] border border-border bg-card p-4 pb-3 transition-colors hover:border-border-strong">
      <header className="mb-3 flex items-start gap-2.5">
        <h3 className="mt-0.5 line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-medium tracking-[-0.005em]">
          {answer.question || (
            <span className="text-muted-foreground italic">No question</span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(answer)}
          aria-label="Edit answer"
          className="flex size-[26px] flex-shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand-soft text-brand transition-colors hover:bg-brand/25"
        >
          <Pencil size={13} />
        </button>
      </header>

      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <Snippet variant="default" text={answer.short_answer} />
        <Snippet variant="detailed" text={answer.long_answer} />
      </div>

      {edited && (
        <footer className="mt-auto flex items-center justify-end border-t border-border-subtle pt-2">
          <span className="text-[11px] text-text-faint">Edited {edited}</span>
        </footer>
      )}
    </article>
  )
}
