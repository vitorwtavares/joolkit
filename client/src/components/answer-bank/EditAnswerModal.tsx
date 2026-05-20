import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  useCreateAnswer,
  useUpdateAnswer,
  useDeleteAnswer,
} from '@/api/hooks/useAnswers'
import type { Answer } from '@/api/hooks/useAnswers'

interface EditAnswerModalProps {
  open: boolean
  answer: Answer | null
  onClose: () => void
}

function countStats(text: string) {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return { chars, words }
}

export function EditAnswerModal({
  open,
  answer,
  onClose,
}: EditAnswerModalProps) {
  const [question, setQuestion] = useState('')
  const [shortAnswer, setShortAnswer] = useState('')
  const [longAnswer, setLongAnswer] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const questionRef = useRef<HTMLInputElement>(null)

  const createAnswer = useCreateAnswer()
  const updateAnswer = useUpdateAnswer()
  const deleteAnswer = useDeleteAnswer()

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setQuestion(answer?.question ?? '')
      setShortAnswer(answer?.short_answer ?? '')
      setLongAnswer(answer?.long_answer ?? '')
      setConfirmClose(false)
      setConfirmDelete(false)
    }
  }, [open, answer])
  /* eslint-enable react-hooks/set-state-in-effect */

  const isDirty =
    question !== (answer?.question ?? '') ||
    shortAnswer !== (answer?.short_answer ?? '') ||
    longAnswer !== (answer?.long_answer ?? '')

  function requestClose() {
    if (isDirty) {
      setConfirmClose(true)
    } else {
      onClose()
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) requestClose()
  }

  async function handleSave() {
    const trimmedQuestion = question.trim()
    const trimmedShort = shortAnswer.trim()
    const trimmedLong = longAnswer.trim()
    if (!trimmedShort) return
    setSaving(true)
    try {
      if (answer) {
        await updateAnswer.mutateAsync({
          id: answer.id,
          question: trimmedQuestion,
          short_answer: trimmedShort,
          long_answer: trimmedLong || null,
          preferred_variant: answer.preferred_variant,
        })
      } else {
        await createAnswer.mutateAsync({
          question: trimmedQuestion,
          short_answer: trimmedShort,
          long_answer: trimmedLong || null,
          preferred_variant: 'short',
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!answer) return
    setSaving(true)
    try {
      await deleteAnswer.mutateAsync(answer.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const shortStats = countStats(shortAnswer)
  const longStats = countStats(longAnswer)

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            questionRef.current?.focus()
          }}
          className="flex max-h-[calc(100vh-2rem)] w-[1040px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border border-border/60 bg-card p-0 ring-0 sm:max-w-[min(1040px,calc(100vw-2rem))]"
        >
          <DialogTitle className="sr-only">
            {answer ? 'Edit answer' : 'New answer'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit the question, default answer, and detailed answer for this
            entry.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-border-subtle px-[22px] py-[18px]">
            <input
              ref={questionRef}
              id="answer-question"
              name="answer-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold tracking-[-0.015em] text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={requestClose}
              className="flex-shrink-0 text-muted-foreground"
            >
              <X />
            </Button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-y-auto bg-border-subtle md:grid-cols-2">
            <div className="flex flex-col gap-2.5 bg-card px-[22px] pt-[18px] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.07em] text-text-faint uppercase">
                  Default
                </span>
                <span className="font-mono text-[11px] text-text-faint">
                  {shortStats.chars} chars · {shortStats.words} words
                </span>
              </div>
              <textarea
                id="answer-short"
                name="answer-short"
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                placeholder="Write your default answer..."
                className="h-[240px] resize-none rounded-lg border border-border bg-background px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/50 focus:border-brand-border focus:ring-3 focus:ring-brand-soft"
              />
            </div>
            <div className="flex flex-col gap-2.5 bg-card px-[22px] pt-[18px] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.07em] text-text-faint uppercase">
                  Detailed
                </span>
                <span className="font-mono text-[11px] text-text-faint">
                  {longStats.chars} chars · {longStats.words} words
                </span>
              </div>
              <textarea
                id="answer-long"
                name="answer-long"
                value={longAnswer}
                onChange={(e) => setLongAnswer(e.target.value)}
                placeholder="Write a more detailed version of your answer..."
                className="h-[240px] resize-none rounded-lg border border-border bg-background px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/50 focus:border-brand-border focus:ring-3 focus:ring-brand-soft"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-subtle px-[22px] py-3.5">
            <div className="flex items-center gap-3">
              {answer && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={requestClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !shortAnswer.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. They will be lost if you close now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this answer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the question and both answer variants.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete answer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
