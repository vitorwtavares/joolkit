import { useState } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
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
import { useDeleteAnswer, useUpdateAnswer } from '@/api/hooks/useAnswers'
import type { Answer } from '@/api/hooks/useAnswers'
import { Snippet } from './Snippet'
import { TagInput } from './TagInput'

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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteAnswer = useDeleteAnswer()
  const updateAnswer = useUpdateAnswer()

  return (
    <>
      <article className="group/card relative flex min-h-[196px] flex-col rounded-[10px] border border-border bg-card p-4 pb-3 transition-colors hover:border-border-strong">
        <header className="mb-3 flex items-start gap-2.5">
          <h3 className="mt-0.5 line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-medium tracking-[-0.005em]">
            {answer.question || (
              <span className="text-muted-foreground italic">No question</span>
            )}
          </h3>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(answer)}
              aria-label="Edit answer"
              className="flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-brand-soft text-brand transition-colors hover:bg-brand/25"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete answer"
              className="flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:bg-danger-soft-fill hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </header>

        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <Snippet variant="default" text={answer.short_answer} />
          <Snippet variant="detailed" text={answer.long_answer} />
        </div>

        <footer className="mt-auto flex items-center gap-3 border-t border-border-subtle pt-2.5">
          <TagInput
            tags={answer.tags ?? []}
            onChange={(next) =>
              updateAnswer.mutate({ id: answer.id, tags: next })
            }
            className="min-w-0 flex-1"
          />
          {edited && (
            <span className="shrink-0 text-[12px] text-text-faint">
              Edited {edited}
            </span>
          )}
        </footer>
      </article>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(v) => {
          if (!deleteAnswer.isPending) setConfirmDelete(v)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this answer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the question and both answer variants.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAnswer.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteAnswer.isPending}
              onClick={(e) => {
                e.preventDefault()
                deleteAnswer.mutate(answer.id, {
                  onSettled: () => setConfirmDelete(false),
                })
              }}
            >
              {deleteAnswer.isPending && <Loader2 className="animate-spin" />}
              Delete answer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
