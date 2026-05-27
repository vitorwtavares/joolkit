import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnswers } from '@/api/hooks/useAnswers'
import { AnswerCard } from '@/components/answer-bank/AnswerCard'
import { EmptySlotCard } from '@/components/answer-bank/EmptySlotCard'
import { EditAnswerModal } from '@/components/answer-bank/EditAnswerModal'
import type { Answer } from '@/api/hooks/useAnswers'

const SKELETON_COUNT = 6
const MAX_ANSWERS = 12

export default function AnswerBank() {
  const { data: answers = [], isLoading } = useAnswers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null)

  function openNew() {
    setEditingAnswer(null)
    setModalOpen(true)
  }

  function openEdit(answer: Answer) {
    setEditingAnswer(answer)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingAnswer(null)
  }

  const canAddMore = answers.length < MAX_ANSWERS

  return (
    <div className="flex-1 overflow-y-auto p-16 pb-6">
      <PageHeader
        title="Answers"
        subtitle={
          <>
            Saved takes on common screening questions. Click{' '}
            <span className="font-medium text-brand">Default</span> or{' '}
            <span className="font-medium text-brand">Detailed</span> to copy;
            pencil to edit.
          </>
        }
        right={
          <Button onClick={openNew} disabled={!canAddMore}>
            <Plus size={13} />
            New answer
          </Button>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
        {isLoading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-[196px] rounded-[10px] bg-card" />
          ))
        ) : (
          <>
            {answers.map((answer) => (
              <AnswerCard key={answer.id} answer={answer} onEdit={openEdit} />
            ))}
            {canAddMore && <EmptySlotCard onAdd={openNew} />}
          </>
        )}
      </div>

      <EditAnswerModal
        open={modalOpen}
        answer={editingAnswer}
        onClose={handleClose}
      />
    </div>
  )
}
