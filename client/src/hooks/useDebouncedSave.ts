import { useState, useRef, useEffect } from 'react'

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

  function cancelTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function flushSave(next: string | null) {
    if (next === lastSavedRef.current) return
    lastSavedRef.current = next
    onSaveRef.current(next)
  }

  function schedule(next: string | null) {
    cancelTimer()
    timerRef.current = setTimeout(() => flushSave(next), debounceMs)
  }

  return { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule }
}
