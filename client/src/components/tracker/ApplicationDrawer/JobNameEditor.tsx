import { useRef, useState } from 'react'

const DEBOUNCE_MS = 600

interface JobNameEditorProps {
  value: string | null
  onSave: (v: string | null) => void
}

export function JobNameEditor({ value, onSave }: JobNameEditorProps) {
  const [draft, setDraft] = useState(value ?? '')
  const onSaveRef = useRef(onSave)
  const lastSavedRef = useRef<string | null>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setDraft(next)
    cancelTimer()
    timerRef.current = setTimeout(
      () => flushSave(next.trim() || null),
      DEBOUNCE_MS,
    )
  }

  function handleBlur() {
    cancelTimer()
    flushSave(draft.trim() || null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      cancelTimer()
      flushSave(draft.trim() || null)
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      cancelTimer()
      setDraft(value ?? '')
      lastSavedRef.current = value
      e.currentTarget.blur()
    }
  }

  return (
    <input
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      maxLength={100}
      placeholder="Job title"
      className="w-full bg-transparent pl-2 text-[20px] text-foreground/80 outline-none placeholder:text-muted-foreground/30"
    />
  )
}
