import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAnswers, useReorderAnswers } from '@/api/hooks/useAnswers'
import {
  AnswerEntry,
  EmptyAnswerEntry,
} from '@/components/answer-bank/AnswerEntry'
import { EditAnswerModal } from '@/components/answer-bank/EditAnswerModal'
import type { Answer } from '@/api/hooks/useAnswers'

const INITIAL_VISIBLE_SLOTS = 5
const MAX_ANSWERS = 8

export default function AnswerBank() {
  const { data: answers = [], isLoading } = useAnswers()
  const reorderAnswers = useReorderAnswers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = answers.findIndex((a) => a.id === active.id)
    const newIndex = answers.findIndex((a) => a.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const nextOrder = arrayMove(answers, oldIndex, newIndex)
    reorderAnswers.mutate(nextOrder.map((a) => a.id))
  }

  const visibleSlots = Math.max(
    INITIAL_VISIBLE_SLOTS,
    Math.min(MAX_ANSWERS, answers.length + 1),
  )
  const emptyCount = visibleSlots - answers.length

  return (
    <div className="flex-1 overflow-y-auto p-16 pb-6">
      <PageHeader
        title="Answers"
        subtitle="Click any entry to copy its selected version. Use the pencil icon to edit. Drag the handle to reorder."
      />

      <div className="flex w-full max-w-[850px] flex-col gap-2">
        <div className="mb-1 flex justify-start">
          <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[12px] text-muted-foreground">
            {isLoading
              ? `— / ${MAX_ANSWERS} used`
              : `${answers.length} / ${MAX_ANSWERS} used`}
          </span>
        </div>

        {isLoading ? (
          <>
            {Array.from({ length: INITIAL_VISIBLE_SLOTS }).map((_, i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded-lg bg-secondary/40"
              />
            ))}
          </>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={answers.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {answers.map((answer, i) => (
                  <AnswerEntry
                    key={answer.id}
                    position={i + 1}
                    answer={answer}
                    onEdit={openEdit}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {Array.from({ length: emptyCount }, (_, i) => {
              const pos = answers.length + i + 1
              return (
                <EmptyAnswerEntry
                  key={`empty-${pos}`}
                  position={pos}
                  onAdd={openNew}
                />
              )
            })}
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
