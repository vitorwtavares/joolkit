import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Answer } from '@/api/hooks/useAnswers'
import {
  DEFAULT_ANSWER_MAX_LENGTH,
  DETAILED_ANSWER_MAX_LENGTH,
} from '@/utils/answerLimits'
import { EditAnswerModal } from './EditAnswerModal'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/api/hooks/useAnswers', () => ({
  useCreateAnswer: () => ({ mutateAsync: mockCreate }),
  useUpdateAnswer: () => ({ mutateAsync: mockUpdate }),
  useDeleteAnswer: () => ({ mutateAsync: mockDelete }),
}))

vi.mock('@/components/billing/UpgradeProvider', () => ({
  useUpgrade: () => ({
    openUpgrade: vi.fn(),
    handlePlanLimitError: () => false,
  }),
}))

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'a1',
    user_id: 'u1',
    position: 1,
    question: 'Existing Q',
    short_answer: 'Existing short',
    long_answer: 'Existing long',
    preferred_variant: 'short',
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderModal({
  open = true,
  answer = null as Answer | null,
  onClose = vi.fn(),
}: {
  open?: boolean
  answer?: Answer | null
  onClose?: () => void
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <EditAnswerModal open={open} answer={answer} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose, ...utils }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue(undefined)
  mockUpdate.mockResolvedValue(undefined)
  mockDelete.mockResolvedValue(undefined)
})

describe('EditAnswerModal', () => {
  it('creates with trimmed values on Save', async () => {
    const onClose = vi.fn()
    renderModal({ answer: null, onClose })

    fireEvent.change(screen.getByPlaceholderText(/type your question here/i), {
      target: { value: '  Why hire you?  ' },
    })
    fireEvent.change(
      screen.getByPlaceholderText(/write your default answer/i),
      {
        target: { value: '  short body  ' },
      },
    )
    fireEvent.change(screen.getByPlaceholderText(/more detailed version/i), {
      target: { value: '   ' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce())
    expect(mockCreate).toHaveBeenCalledWith({
      question: 'Why hire you?',
      short_answer: 'short body',
      long_answer: null,
      preferred_variant: 'short',
      tags: [],
    })
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('preserves the preferred_variant on update', async () => {
    const onClose = vi.fn()
    const answer = makeAnswer({ preferred_variant: 'long' })
    renderModal({ answer, onClose })

    fireEvent.change(
      screen.getByPlaceholderText(/write your default answer/i),
      { target: { value: 'Updated short' } },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledOnce())
    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'a1',
      question: 'Existing Q',
      short_answer: 'Updated short',
      long_answer: 'Existing long',
      preferred_variant: 'long',
      tags: [],
    })
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('sets maxLength on answer textareas', () => {
    renderModal({ answer: null })

    expect(
      screen.getByPlaceholderText(/write your default answer/i),
    ).toHaveAttribute('maxLength', String(DEFAULT_ANSWER_MAX_LENGTH))
    expect(
      screen.getByPlaceholderText(/more detailed version/i),
    ).toHaveAttribute('maxLength', String(DETAILED_ANSWER_MAX_LENGTH))
  })

  it('opens the discard-changes dialog when closing while dirty and closes only after Discard', async () => {
    const onClose = vi.fn()
    renderModal({ answer: makeAnswer(), onClose })

    fireEvent.change(
      screen.getByPlaceholderText(/write your default answer/i),
      { target: { value: 'something new' } },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    const discardDialog = await screen.findByRole('alertdialog')
    expect(
      within(discardDialog).getByText(/discard changes\?/i),
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(
      within(discardDialog).getByRole('button', { name: /^discard$/i }),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('opens a confirm AlertDialog when Delete is clicked without deleting yet', async () => {
    renderModal({ answer: makeAnswer() })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    const confirmDialog = await screen.findByRole('alertdialog')
    expect(
      within(confirmDialog).getByText(/delete this answer\?/i),
    ).toBeInTheDocument()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('confirming deletion calls deleteAnswer and closes the modal', async () => {
    const onClose = vi.fn()
    renderModal({ answer: makeAnswer(), onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const confirmDialog = await screen.findByRole('alertdialog')
    fireEvent.click(
      within(confirmDialog).getByRole('button', { name: /delete answer/i }),
    )

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('a1'))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
