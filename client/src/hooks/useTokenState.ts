import { useEffect, useRef, useState } from 'react'
import { useUpdateCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'

interface TokenData {
  role?: string | null
  company?: string | null
}

const DEBOUNCE_MS = 400

export function useTokenState(tokenData: TokenData | null | undefined) {
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didSync = useRef(false)
  const updateTokens = useUpdateCoverLetterTokens()

  useEffect(() => {
    if (didSync.current || !tokenData) return
    setRole(tokenData.role ?? '')
    setCompany(tokenData.company ?? '')
    didSync.current = true
  }, [tokenData])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function scheduleTokenSave(newRole: string, newCompany: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateTokens.mutate({
        role: newRole || null,
        company: newCompany || null,
      })
      timerRef.current = null
    }, DEBOUNCE_MS)
  }

  function flushTokenSave(currentRole: string, currentCompany: string) {
    if (!timerRef.current) return
    clearTimeout(timerRef.current)
    timerRef.current = null
    updateTokens.mutate({
      role: currentRole || null,
      company: currentCompany || null,
    })
  }

  async function flushTokenSaveAsync(
    currentRole: string,
    currentCompany: string,
  ) {
    if (!timerRef.current) return
    clearTimeout(timerRef.current)
    timerRef.current = null
    await updateTokens.mutateAsync({
      role: currentRole || null,
      company: currentCompany || null,
    })
  }

  return {
    role,
    setRole,
    company,
    setCompany,
    scheduleTokenSave,
    flushTokenSave,
    flushTokenSaveAsync,
  }
}
