import { describe, expect, it } from 'vitest'
import { TOKEN_COMPANY, TOKEN_ROLE } from '@/constants'
import { getCoverLetterTokenValidation } from './tokenValidation'

describe('getCoverLetterTokenValidation', () => {
  it('does not mark empty fields unresolved when tokens are absent from the editor text', () => {
    const validation = getCoverLetterTokenValidation({
      text: 'I am excited to apply.',
      role: '',
      company: '',
    })

    expect(validation.unresolvedTokens).toEqual([])
    expect(validation.isRoleUnresolved).toBe(false)
    expect(validation.isCompanyUnresolved).toBe(false)
  })

  it('marks only empty fields whose tokens appear in the editor text', () => {
    const validation = getCoverLetterTokenValidation({
      text: `I am excited about the ${TOKEN_ROLE} role.`,
      role: '',
      company: '',
    })

    expect(validation.unresolvedTokens).toEqual([TOKEN_ROLE])
    expect(validation.isRoleUnresolved).toBe(true)
    expect(validation.isCompanyUnresolved).toBe(false)
  })

  it('treats whitespace-only token values as unresolved', () => {
    const validation = getCoverLetterTokenValidation({
      text: `I would love to join ${TOKEN_COMPANY}.`,
      role: 'Product Designer',
      company: '   ',
    })

    expect(validation.unresolvedTokens).toEqual([TOKEN_COMPANY])
  })
})
