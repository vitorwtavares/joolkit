import type { CoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'

export interface EditableCoverLetterToken {
  id: string
  key: string
  value: string
}

export const TOKEN_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

export function normalizeTokenKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeTokenKeyDraft(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
}

export function formatToken(key: string): string {
  return `{{${normalizeTokenKey(key) || 'token'}}}`
}

export function extractTokenKeys(text: string): string[] {
  const keys = new Set<string>()
  TOKEN_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const key = normalizeTokenKey(match[1] ?? '')
    if (key) keys.add(key)
  }

  return [...keys]
}

function buildTokenValueByKey(
  tokens: Pick<EditableCoverLetterToken, 'key' | 'value'>[],
): Map<string, string> {
  const byKey = new Map<string, string>()

  for (const token of tokens) {
    const key = normalizeTokenKey(token.key)
    if (!key || byKey.has(key)) continue
    byKey.set(key, token.value)
  }

  return byKey
}

export function getTokenValueMap(
  tokens: Pick<EditableCoverLetterToken, 'key' | 'value'>[],
): Record<string, string> {
  return Object.fromEntries(buildTokenValueByKey(tokens))
}

export function dedupeCoverLetterTokensByKey(
  tokens: Pick<EditableCoverLetterToken, 'key' | 'value'>[],
): { key: string; value: string }[] {
  return [...buildTokenValueByKey(tokens).entries()].map(([key, value]) => ({
    key,
    value,
  }))
}

export function tiptapDocToText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: unknown; content?: unknown }
  const ownText = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content)
    ? node.content.map(tiptapDocToText).join('')
    : ''
  return `${ownText}${children}`
}

export function getDuplicateTokenKeyIds(
  tokens: Pick<EditableCoverLetterToken, 'id' | 'key'>[],
): Set<string> {
  const idsByKey = new Map<string, string[]>()

  for (const token of tokens) {
    const key = normalizeTokenKey(token.key)
    if (!key) continue
    const ids = idsByKey.get(key) ?? []
    ids.push(token.id)
    idsByKey.set(key, ids)
  }

  const duplicateIds = new Set<string>()
  for (const ids of idsByKey.values()) {
    if (ids.length > 1) {
      for (const id of ids) duplicateIds.add(id)
    }
  }

  return duplicateIds
}

export function toEditableCoverLetterTokens(
  tokens: CoverLetterTokens[] | null | undefined,
  createEmptyToken: () => EditableCoverLetterToken,
): EditableCoverLetterToken[] {
  if (!tokens || tokens.length === 0) return [createEmptyToken()]
  return tokens.map((token) => ({
    id: token.id,
    key: token.key,
    value: token.value ?? '',
  }))
}
