import { useState, useRef, useEffect } from 'react'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'

interface CompanyNameEditorProps {
  value: string | null
  onSave: (value: string | null) => void
}

export function CompanyNameEditor({ value, onSave }: CompanyNameEditorProps) {
  const [editing, setEditing] = useState(true)
  const { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule } =
    useDebouncedSave(value, onSave)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const skipNextBlurRef = useRef(false)

  function confirmAndExit() {
    cancelTimer()
    flushSave(draft.trim() || null)
    setEditing(false)
  }

  useEffect(() => {
    if (value === lastSavedRef.current) return
    cancelTimer()
    setDraft(value ?? '')
    lastSavedRef.current = value
  }, [value, cancelTimer, lastSavedRef, setDraft])

  useEffect(() => {
    if (!editing) return
    schedule(draft.trim() || null)
    return cancelTimer
  }, [draft, editing, cancelTimer, schedule])

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
