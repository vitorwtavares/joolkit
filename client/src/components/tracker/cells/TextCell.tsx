import { useState, useRef, useEffect } from 'react'
import { EmptyCell } from './EmptyCell'
import { sanitizeUrl } from '@/utils/sanitizeUrl'

interface TextCellProps {
  value: string | null
  onSave: (value: string | null) => void
  url?: string | null
  bold?: boolean
  className?: string
}

const DEBOUNCE_MS = 600

export function TextCell({
  value,
  onSave,
  url,
  bold,
  className = '',
}: TextCellProps) {
  const safeUrl = url ? sanitizeUrl(url) : null
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const onSaveRef = useRef(onSave)
  const lastSavedRef = useRef<string | null>(null)
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

  function startEdit() {
    setDraft(value ?? '')
    lastSavedRef.current = value
    setEditing(true)
  }

  function confirmAndExit() {
    cancelTimer()
    flushSave(draft.trim() || null)
    setEditing(false)
  }

  useEffect(() => {
    if (!editing) return
    cancelTimer()
    const next = draft.trim() || null
    if (next === lastSavedRef.current) return
    timerRef.current = setTimeout(() => flushSave(next), DEBOUNCE_MS)
    return cancelTimer
  }, [draft, editing])

  if (editing) {
    return (
      <div className={`absolute inset-0 flex items-center px-3 ${className}`}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={confirmAndExit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmAndExit()
            if (e.key === 'Escape') {
              cancelTimer()
              setEditing(false)
            }
          }}
          className="w-full bg-transparent text-[14px] text-foreground outline-none"
          style={{ fontWeight: bold ? 500 : undefined }}
        />
      </div>
    )
  }

  return (
    <span
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') startEdit()
      }}
      className={`absolute inset-0 flex cursor-text items-center overflow-hidden px-3 text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.04)] ${className}`}
      style={{ fontWeight: bold ? 500 : undefined }}
    >
      {safeUrl && value ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate transition-colors hover:text-foreground/80"
        >
          {value}
        </a>
      ) : (
        <span className="truncate">{value ?? <EmptyCell />}</span>
      )}
    </span>
  )
}
