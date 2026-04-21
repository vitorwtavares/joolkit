import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import type { Answer } from '@/api/hooks/useAnswers'
import { AnswerEntry } from './AnswerEntry'

const mockMutate = vi.fn()

vi.mock('@/api/hooks/useAnswers', () => ({
  useUpdateAnswer: () => ({ mutate: mockMutate }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'a1',
    user_id: 'u1',
    position: 1,
    question: 'What is your biggest strength?',
    short_answer: 'Short answer body',
    long_answer: null,
    preferred_variant: 'short',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderEntry(answer: Answer, onEdit = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    onEdit,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DndContext>
          <SortableContext items={[answer.id]}>
            <AnswerEntry
              position={answer.position}
              answer={answer}
              onEdit={onEdit}
            />
          </SortableContext>
        </DndContext>
      </QueryClientProvider>,
    ),
  }
}

let writeText: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  })
})

describe('AnswerEntry copy behaviour', () => {
  it('copies the short answer when default variant is preferred', async () => {
    renderEntry(
      makeAnswer({
        short_answer: 'the short one',
        long_answer: 'the long one',
        preferred_variant: 'short',
      }),
    )

    fireEvent.click(screen.getByText('What is your biggest strength?'))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('the short one'))
  })

  it('copies the long answer when long variant is preferred', async () => {
    renderEntry(
      makeAnswer({
        short_answer: 'the short one',
        long_answer: 'the long one',
        preferred_variant: 'long',
      }),
    )

    fireEvent.click(screen.getByText('What is your biggest strength?'))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('the long one'))
  })
})

describe('AnswerEntry variant toggle', () => {
  it('switches variant and calls updateAnswer.mutate', async () => {
    renderEntry(
      makeAnswer({
        short_answer: 'short',
        long_answer: 'long',
        preferred_variant: 'short',
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }))

    expect(mockMutate).toHaveBeenCalledWith({
      id: 'a1',
      preferred_variant: 'long',
    })

    fireEvent.click(screen.getByText('What is your biggest strength?'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('long'))
  })
})

describe('AnswerEntry edit action', () => {
  it('calls onEdit with the answer when the pencil button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const answer = makeAnswer()
    renderEntry(answer, onEdit)

    await user.click(screen.getByRole('button', { name: /edit answer/i }))
    expect(onEdit).toHaveBeenCalledWith(answer)
  })
})
