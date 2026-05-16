import { useState, useRef, useEffect } from 'react'

interface CompanyNameEditorProps {
  value: string | null
  onSave: (value: string | null) => void
  onCommit?: () => void
}

export function CompanyNameEditor({
  value,
  onSave,
  onCommit,
}: CompanyNameEditorProps) {
  const [editing, setEditing] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  function commitAndExit() {
    const trimmed = value?.trim() ?? ''
    if (trimmed !== (value ?? '')) onSave(trimmed || null)
    onCommit?.()
    setEditing(false)
  }

  useEffect(() => {
    if (!editing) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    const len = el.value.length
    el.setSelectionRange(len, len)
  }, [editing])

  const draft = value ?? ''

  return (
    <div className="relative">
      <textarea
        name="tracker-company-name"
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
          onSave(e.target.value || null)
          e.target.style.height = 'auto'
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        onBlur={commitAndExit}
        maxLength={50}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
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
