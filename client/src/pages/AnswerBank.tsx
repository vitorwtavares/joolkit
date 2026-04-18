import { useState } from 'react'
import { useAnswers } from '@/api/hooks/useAnswers'
import { AnswerEntry } from '@/components/answer-bank/AnswerEntry'
import { EditAnswerModal } from '@/components/answer-bank/EditAnswerModal'
import type { Answer } from '@/api/hooks/useAnswers'

const MAX_ANSWERS = 8

export default function AnswerBank() {
  const { data: answers = [], isLoading } = useAnswers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null)
  const [editingPosition, setEditingPosition] = useState<number>(1)

  function openNew(position: number) {
    setEditingAnswer(null)
    setEditingPosition(position)
    setModalOpen(true)
  }

  function openEdit(answer: Answer) {
    setEditingAnswer(answer)
    setEditingPosition(answer.position)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingAnswer(null)
  }

  const slots = Array.from({ length: MAX_ANSWERS }, (_, i) => {
    const pos = i + 1
    return answers.find((a) => a.position === pos) ?? null
  })

  return (
    <div className="flex-1 overflow-y-auto p-16 pb-6">
      <div className="mb-1 flex items-start justify-between">
        <h1 className="text-[36px] font-medium tracking-tight">Answers</h1>
        <span className="mt-2 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[12px] text-muted-foreground">
          {isLoading
            ? `— / ${MAX_ANSWERS} used`
            : `${answers.length} / ${MAX_ANSWERS} used`}
        </span>
      </div>
      <p className="mb-8 text-[14px] text-muted-foreground">
        Click any entry to copy its selected version. Use the pencil icon to
        edit.
      </p>

      {isLoading ? (
        <div className="flex max-w-[740px] flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[52px] animate-pulse rounded-lg bg-secondary/40"
            />
          ))}
        </div>
      ) : (
        <div className="flex max-w-[740px] flex-col gap-2">
          {slots.map((answer, i) => (
            <AnswerEntry
              key={answer?.id ?? `empty-${i}`}
              position={i + 1}
              answer={answer}
              onAdd={() => openNew(i + 1)}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <EditAnswerModal
        open={modalOpen}
        answer={editingAnswer}
        position={editingPosition}
        onClose={handleClose}
      />
    </div>
  )
}
