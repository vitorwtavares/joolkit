interface JobNameEditorProps {
  value: string | null
  onSave: (v: string | null) => void
  onCommit?: () => void
}

export function JobNameEditor({ value, onSave, onCommit }: JobNameEditorProps) {
  function commit() {
    const trimmed = value?.trim() ?? ''
    if (trimmed !== (value ?? '')) onSave(trimmed || null)
    onCommit?.()
  }

  return (
    <input
      value={value ?? ''}
      onChange={(e) => onSave(e.target.value || null)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      maxLength={100}
      placeholder="Job title"
      className="w-full bg-transparent pl-2 text-[20px] text-foreground/80 outline-none placeholder:text-muted-foreground/30"
    />
  )
}
