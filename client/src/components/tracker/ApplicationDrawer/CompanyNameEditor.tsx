import { useState, useRef, useEffect } from 'react'

const NAME_DEBOUNCE_MS = 600

interface CompanyNameEditorProps {
  value: string | null
  onSave: (value: string | null) => void
}

export function CompanyNameEditor({ value, onSave }: CompanyNameEditorProps) {
  const [editing, setEditing] = useState(true)
  const [draft, setDraft] = useState(value ?? '')
  const onSaveRef = useRef(onSave)
  const lastSavedRef = useRef<string | null>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const skipNextBlurRef = useRef(false)

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

  function confirmAndExit() {
    cancelTimer()
    flushSave(draft.trim() || null)
    setEditing(false)
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value === lastSavedRef.current) return
    cancelTimer()
    setDraft(value ?? '')
    lastSavedRef.current = value
    setEditing(true)
  }, [value])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!editing) return
    cancelTimer()
    const next = draft.trim() || null
    if (next === lastSavedRef.current) return
    timerRef.current = setTimeout(() => flushSave(next), NAME_DEBOUNCE_MS)
    return cancelTimer
  }, [draft, editing])

  useEffect(() => {
    if (!editing) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    const len = el.value.length
    el.setSelectionRange(len, len)
  }, [editing])

  return (
    <div className="relative">
      <textarea
        readOnly={!editing}
        value={draft}
        rows={1}
        ref={(el) => {
          textareaRef.current = el
          if (el) {
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }
        }}
        onFocus={(e) => {
          setEditing(true)
          const len = e.target.value.length
          e.target.setSelectionRange(len, len)
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        onBlur={() => {
          if (skipNextBlurRef.current) {
            skipNextBlurRef.current = false
            return
          }
          confirmAndExit()
        }}
        maxLength={50}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            confirmAndExit()
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            cancelTimer()
            setDraft(value ?? '')
            lastSavedRef.current = value
            setEditing(false)
            skipNextBlurRef.current = true
            e.currentTarget.blur()
          }
        }}
        placeholder="Untitled"
        className={`w-full resize-none overflow-hidden bg-transparent py-0 pl-2 text-[32px] leading-tight font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 ${
          editing ? 'caret-auto' : 'cursor-text caret-transparent'
        }`}
      />
      {editing && draft.length > 40 && (
        <p className="absolute right-0 -bottom-4 text-[11px] text-muted-foreground/40">
          {draft.length}/50
        </p>
      )}
    </div>
  )
}
