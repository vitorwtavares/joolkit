import { useEffect, useRef, useState } from 'react'
import {
  type CoverLetterTokens,
  useUpdateCoverLetterTokens,
} from '@/api/hooks/useCoverLetterTokens'
import {
  type EditableCoverLetterToken,
  dedupeCoverLetterTokensByKey,
  normalizeTokenKey,
  normalizeTokenKeyDraft,
  toEditableCoverLetterTokens,
} from '@/components/cover-letter/tokens/tokenUtils'

type TokenData = CoverLetterTokens[]

const DEBOUNCE_MS = 400
let tokenId = 0

function createEmptyToken(): EditableCoverLetterToken {
  tokenId += 1
  return { id: `new-${tokenId}`, key: '', value: '' }
}

export function useTokenState(tokenData: TokenData | null | undefined) {
  const [tokens, setTokens] = useState<EditableCoverLetterToken[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokensRef = useRef<EditableCoverLetterToken[]>([])
  const didSync = useRef(false)
  const updateTokens = useUpdateCoverLetterTokens()

  function ensureEditableTokens(
    nextTokens: EditableCoverLetterToken[],
  ): EditableCoverLetterToken[] {
    return nextTokens.length > 0 ? nextTokens : [createEmptyToken()]
  }

  function getPersistedTokens(nextTokens: EditableCoverLetterToken[]) {
    return dedupeCoverLetterTokensByKey(nextTokens)
  }

  function persistTokens(nextTokens: EditableCoverLetterToken[]) {
    updateTokens.mutate({ tokens: getPersistedTokens(nextTokens) })
  }

  useEffect(() => {
    if (didSync.current || tokenData === undefined) return
    const nextTokens = toEditableCoverLetterTokens(tokenData, createEmptyToken)
    setTokens(nextTokens)
    tokensRef.current = nextTokens
    didSync.current = true
  }, [tokenData])

  useEffect(() => {
    tokensRef.current = tokens
  }, [tokens])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function scheduleTokenSave(nextTokens: EditableCoverLetterToken[]) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      persistTokens(nextTokens)
      timerRef.current = null
    }, DEBOUNCE_MS)
  }

  function flushTokenSave() {
    if (!timerRef.current) return
    clearTimeout(timerRef.current)
    timerRef.current = null
    persistTokens(tokensRef.current)
  }

  async function flushTokenSaveAsync() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    await updateTokens.mutateAsync({
      tokens: getPersistedTokens(tokensRef.current),
    })
  }

  function setTokenAndSave(
    updater: (
      current: EditableCoverLetterToken[],
    ) => EditableCoverLetterToken[],
  ) {
    setTokens((current) => {
      const next = ensureEditableTokens(updater(current))
      tokensRef.current = next
      scheduleTokenSave(next)
      return next
    })
  }

  function updateToken(
    id: string,
    patch: Partial<Pick<EditableCoverLetterToken, 'key' | 'value'>>,
  ) {
    setTokenAndSave((current) =>
      current.map((token) =>
        token.id === id
          ? {
              ...token,
              ...patch,
              ...(patch.key !== undefined
                ? { key: normalizeTokenKeyDraft(patch.key) }
                : {}),
            }
          : token,
      ),
    )
  }

  function addToken() {
    setTokens((current) => {
      const next = [...current, createEmptyToken()]
      tokensRef.current = next
      return next
    })
  }

  function ensureTokenByKey(key: string) {
    const normalized = normalizeTokenKey(key)
    if (!normalized) return

    setTokenAndSave((current) => {
      if (
        current.some((token) => normalizeTokenKey(token.key) === normalized)
      ) {
        return current
      }

      const emptyIndex = current.findIndex(
        (token) => !normalizeTokenKey(token.key),
      )

      if (emptyIndex !== -1) {
        return current.map((token, index) =>
          index === emptyIndex ? { ...token, key: normalized } : token,
        )
      }

      return [...current, { ...createEmptyToken(), key: normalized }]
    })
  }

  function deleteToken(id: string) {
    setTokenAndSave((current) => current.filter((token) => token.id !== id))
  }

  return {
    tokens,
    updateToken,
    addToken,
    ensureTokenByKey,
    deleteToken,
    flushTokenSave,
    flushTokenSaveAsync,
  }
}
