import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnswers } from '@/api/hooks/useAnswers'
import { useResourceLimit } from '@/components/billing/useResourceLimit'
import { HiddenDataNotice } from '@/components/billing/HiddenDataNotice'
import { CreateOrUpgradeButton } from '@/components/billing/CreateOrUpgradeButton'
import { AnswerCard } from '@/components/answer-bank/AnswerCard'
import { EmptySlotCard } from '@/components/answer-bank/EmptySlotCard'
import { EditAnswerModal } from '@/components/answer-bank/EditAnswerModal'
import type { Answer } from '@/api/hooks/useAnswers'

const SKELETON_COUNT = 6

export default function AnswerBank() {
  const { data: answers = [], isLoading } = useAnswers()
  const { isPro, limit, hidden, atLimit, openUpgrade } = useResourceLimit(
    'answers',
    answers.length,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null)
  const [search, setSearch] = useState('')

  const canAddMore = !atLimit

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

  const trimmedSearch = search.trim().toLowerCase()
  const filteredAnswers = useMemo(() => {
    if (!trimmedSearch) return answers
    return answers.filter(
      (a) =>
        a.question.toLowerCase().includes(trimmedSearch) ||
        a.tags?.some((tag) => tag.toLowerCase().includes(trimmedSearch)),
    )
  }, [answers, trimmedSearch])

  return (
    <div className="flex-1 overflow-y-auto p-16 pb-6 max-[1599px]:py-12">
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search answers"
                aria-label="Search by question or tag"
                className="h-8 w-[180px] ps-8 pe-7"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute end-1.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <CreateOrUpgradeButton
              atLimit={atLimit}
              isPro={isPro}
              createLabel="New answer"
              upgradeLabel="Upgrade for more"
              onCreate={openNew}
              onUpgrade={openUpgrade}
            />
          </div>
        }
      />

      {hidden > 0 && (
        <HiddenDataNotice
          resource="answers"
          limit={limit}
          hidden={hidden}
          className="mb-4"
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-[196px] rounded-[10px] bg-card" />
          ))}
        </div>
      ) : trimmedSearch && filteredAnswers.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">
          No answers match your search.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3">
          {filteredAnswers.map((answer) => (
            <AnswerCard key={answer.id} answer={answer} onEdit={openEdit} />
          ))}
          {!trimmedSearch && canAddMore && <EmptySlotCard onAdd={openNew} />}
        </div>
      )}

      <EditAnswerModal
        open={modalOpen}
        answer={editingAnswer}
        onClose={handleClose}
      />
    </div>
  )
}
