import {
  type EditableCoverLetterToken,
  extractTokenKeys,
  formatToken,
  getTokenValueMap,
} from './tokenUtils'

interface CoverLetterTokenValidationInput {
  text: string
  tokens: EditableCoverLetterToken[]
}

export function getCoverLetterTokenValidation({
  text,
  tokens,
}: CoverLetterTokenValidationInput): { unresolvedTokens: string[] } {
  const usedTokenKeys = extractTokenKeys(text)
  const tokenValues = getTokenValueMap(tokens)
  const unresolvedTokens = usedTokenKeys
    .filter((key) => (tokenValues[key] ?? '').trim().length === 0)
    .map(formatToken)

  return { unresolvedTokens }
}

export function getCoverLetterUnresolvedTokensAcrossTexts(
  texts: string[],
  tokens: EditableCoverLetterToken[],
): string[] {
  const unresolved = new Set<string>()

  for (const text of texts) {
    for (const token of getCoverLetterTokenValidation({ text, tokens })
      .unresolvedTokens) {
      unresolved.add(token)
    }
  }

  return [...unresolved]
}
