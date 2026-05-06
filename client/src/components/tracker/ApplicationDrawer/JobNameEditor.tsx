import { useDebouncedSave } from '@/hooks/useDebouncedSave'

interface JobNameEditorProps {
  value: string | null
  onSave: (v: string | null) => void
}

export function JobNameEditor({ value, onSave }: JobNameEditorProps) {
  const { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule } =
    useDebouncedSave(value, onSave)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
    schedule(e.target.value.trim() || null)
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
