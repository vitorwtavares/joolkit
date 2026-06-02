import { TOKEN_COMPANY, TOKEN_ROLE } from '@/constants'

interface CoverLetterTokenValidationInput {
  text: string
  role: string
  company: string
}

export interface CoverLetterTokenValidation {
  hasRoleToken: boolean
  hasCompanyToken: boolean
  isRoleUnresolved: boolean
  isCompanyUnresolved: boolean
  unresolvedTokens: string[]
}

export function getCoverLetterTokenValidation({
  text,
  role,
  company,
}: CoverLetterTokenValidationInput): CoverLetterTokenValidation {
  const hasRoleToken = text.includes(TOKEN_ROLE)
  const hasCompanyToken = text.includes(TOKEN_COMPANY)
  const isRoleUnresolved = hasRoleToken && role.trim().length === 0
  const isCompanyUnresolved = hasCompanyToken && company.trim().length === 0

  return {
    hasRoleToken,
    hasCompanyToken,
    isRoleUnresolved,
    isCompanyUnresolved,
    unresolvedTokens: [
      ...(isRoleUnresolved ? [TOKEN_ROLE] : []),
      ...(isCompanyUnresolved ? [TOKEN_COMPANY] : []),
    ],
  }
}
