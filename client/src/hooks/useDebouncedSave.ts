import { useState, useRef, useEffect, useCallback } from 'react'

export function useDebouncedSave(
  value: string | null,
  onSave: (v: string | null) => void,
  debounceMs = 600,
) {
  const [draft, setDraft] = useState(value ?? '')
  const onSaveRef = useRef(onSave)
  const lastSavedRef = useRef<string | null>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onSaveRef.current = onSave
  })

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flushSave = useCallback((next: string | null) => {
    if (next === lastSavedRef.current) return
    lastSavedRef.current = next
    onSaveRef.current(next)
  }, [])

  const schedule = useCallback(
    (next: string | null) => {
      cancelTimer()
      timerRef.current = setTimeout(() => flushSave(next), debounceMs)
    },
    [cancelTimer, debounceMs, flushSave],
  )

  return { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule }
}
