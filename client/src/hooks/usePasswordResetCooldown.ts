import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'am9vbGtpdDpwcmM6djE='
const RESET_COOLDOWNS_SECONDS = [60, 180, 600, 3_600, 86_400]
const COOLDOWN_RESET_AFTER_SECONDS = 7 * 24 * 60 * 60

interface PasswordResetCooldownEntry {
  attempt: number
  nextAllowedAt: number
}

type PasswordResetCooldownStore = Record<string, PasswordResetCooldownEntry>

function encode(text: string) {
  return window.btoa(text)
}

function decode(text: string) {
  return window.atob(text)
}

function readStore(): PasswordResetCooldownStore {
  try {
    const rawStore = window.localStorage.getItem(STORAGE_KEY)
    return rawStore
      ? (JSON.parse(decode(rawStore)) as PasswordResetCooldownStore)
      : {}
  } catch {
    return {}
  }
}

function writeStore(store: PasswordResetCooldownStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, encode(JSON.stringify(store)))
  } catch {
    return
  }
}

function getEmailKey(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail ? encode(normalizedEmail) : ''
}

function getRemainingSeconds(
  entry?: PasswordResetCooldownEntry,
  now = Date.now(),
) {
  if (!entry) return 0
  return Math.max(0, Math.ceil((entry.nextAllowedAt - now) / 1000))
}

export function formatPasswordResetCooldown(seconds: number) {
  if (seconds >= 3_600) return `${Math.ceil(seconds / 3_600)}h`
  if (seconds >= 60) return `${Math.ceil(seconds / 60)}m`
  return `${seconds}s`
}

export function usePasswordResetCooldown(email: string) {
  const emailKey = getEmailKey(email)
  const [, setTick] = useState(0)
  const remainingSeconds = getRemainingSeconds(readStore()[emailKey])

  const refresh = useCallback(() => {
    setTick((tick) => tick + 1)
  }, [])

  const refreshCooldown = useCallback(() => {
    refresh()
    return getRemainingSeconds(readStore()[emailKey])
  }, [emailKey, refresh])

  const startNextCooldown = useCallback(() => {
    if (!emailKey) return

    const store = readStore()
    if (getRemainingSeconds(store[emailKey]) > 0) {
      refresh()
      return
    }

    const previousAttempt = store[emailKey]?.attempt ?? 0
    const cooldownExpiredSecondsAgo = store[emailKey]
      ? Math.max(
          0,
          Math.floor((Date.now() - store[emailKey].nextAllowedAt) / 1000),
        )
      : 0
    const nextAttempt =
      cooldownExpiredSecondsAgo > COOLDOWN_RESET_AFTER_SECONDS
        ? 0
        : previousAttempt
    const cooldownSeconds =
      RESET_COOLDOWNS_SECONDS[
        Math.min(nextAttempt, RESET_COOLDOWNS_SECONDS.length - 1)
      ]
    store[emailKey] = {
      attempt: nextAttempt + 1,
      nextAllowedAt: Date.now() + cooldownSeconds * 1000,
    }

    writeStore(store)
    refresh()
  }, [emailKey, refresh])

  useEffect(() => {
    if (remainingSeconds <= 0) return

    const timer = window.setTimeout(() => {
      refresh()
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [remainingSeconds, refresh])

  return {
    formattedRemaining: formatPasswordResetCooldown(remainingSeconds),
    isCoolingDown: remainingSeconds > 0,
    remainingSeconds,
    refreshCooldown,
    startNextCooldown,
  }
}
