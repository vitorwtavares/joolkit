import type { Answer } from '@/api/hooks/useAnswers'

export interface AnswerFilterConfig {
  operator: 'is' | 'is_not'
  tags: string[]
}

// Includes = answer has at least one selected tag; Excludes = answer has none.
export function answerMatchesFilter(
  answer: Answer,
  filter: AnswerFilterConfig | null,
): boolean {
  if (!filter || filter.tags.length === 0) return true
  const tags = answer.tags ?? []
  const hasAny = filter.tags.some((t) => tags.includes(t))
  return filter.operator === 'is_not' ? !hasAny : hasAny
}

// Unique tags across all answers, alphabetically — the pool the filter offers.
export function collectTags(answers: Answer[]): string[] {
  const set = new Set<string>()
  for (const answer of answers) {
    for (const tag of answer.tags ?? []) set.add(tag)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
