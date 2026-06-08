import { describe, expect, it } from 'vitest'
import {
  getCoverLetterTokenValidation,
  getCoverLetterUnresolvedTokensAcrossTexts,
} from './tokenValidation'

describe('getCoverLetterTokenValidation', () => {
  it('does not mark empty fields unresolved when tokens are absent from the editor text', () => {
    const validation = getCoverLetterTokenValidation({
      text: 'I am excited to apply.',
      tokens: [],
    })

    expect(validation.unresolvedTokens).toEqual([])
  })

  it('marks only empty fields whose tokens appear in the editor text', () => {
    const validation = getCoverLetterTokenValidation({
      text: 'I am excited about the {{role}} role.',
      tokens: [
        { id: '1', key: 'role', value: '' },
        { id: '2', key: 'company', value: '' },
      ],
    })

    expect(validation.unresolvedTokens).toEqual(['{{role}}'])
  })

  it('treats whitespace-only token values as unresolved', () => {
    const validation = getCoverLetterTokenValidation({
      text: 'I would love to join {{company}}.',
      tokens: [
        { id: '1', key: 'role', value: 'Product Designer' },
        { id: '2', key: 'company', value: '   ' },
      ],
    })

    expect(validation.unresolvedTokens).toEqual(['{{company}}'])
  })

  it('normalizes token names from the editor text before matching values', () => {
    const validation = getCoverLetterTokenValidation({
      text: 'Hello {{ Hiring Manager }} at {{Company Name}}.',
      tokens: [
        { id: '1', key: 'hiring-manager', value: 'Jane' },
        { id: '2', key: 'company-name', value: 'Joolkit' },
      ],
    })

    expect(validation.unresolvedTokens).toEqual([])
  })
})

describe('getCoverLetterUnresolvedTokensAcrossTexts', () => {
  it('collects unresolved tokens used across multiple cover letter texts', () => {
    const unresolved = getCoverLetterUnresolvedTokensAcrossTexts(
      [
        'I am excited about the {{role}} role.',
        'I would love to join {{company}}.',
      ],
      [
        { id: '1', key: 'role', value: '' },
        { id: '2', key: 'company', value: 'Joolkit' },
      ],
    )

    expect(unresolved).toEqual(['{{role}}'])
  })

  it('deduplicates unresolved tokens shared by multiple texts', () => {
    const unresolved = getCoverLetterUnresolvedTokensAcrossTexts(
      ['Hello {{company}}.', 'Join {{company}} today.'],
      [{ id: '1', key: 'company', value: '' }],
    )

    expect(unresolved).toEqual(['{{company}}'])
  })
})
