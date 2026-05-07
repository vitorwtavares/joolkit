import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useCopiedBubble } from '@/hooks/useCopiedBubble'

interface CopyButtonProps {
  label: string
  value: string | null
  icon: React.ReactNode
  iconBg?: string
  emptyText: string
  splitName?: boolean
  onSave: (value: string) => Promise<void>
}

export function CopyButton({
  label,
  value,
  icon,
  iconBg,
  emptyText,
  splitName,
  onSave,
}: CopyButtonProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { trigger: triggerCopied, bubble: copiedBubble } = useCopiedBubble()
  const filled = !!value?.trim()

  const isDirty = draft !== (value ?? '')

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
  }

  async function save() {
    const savedDraft = draft.trim()
    setEditing(false)
    setSaving(true)
    try {
      await onSave(savedDraft)
    } catch {
      setDraft(savedDraft)
      setEditing(true)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setEditing(false)
  }

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      triggerCopied()
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  async function copyPart(text: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      triggerCopied()
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary px-3 py-3">
        <div
          className={cn(
            'flex size-[30px] flex-shrink-0 items-center justify-center rounded-md',
            iconBg ?? 'bg-secondary',
          )}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-0.5 text-[12px] text-muted-foreground">
            {label}
          </span>
          <input
            ref={inputRef}
            value={draft}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isDirty) save()
              if (e.key === 'Escape') cancel()
            }}
            className="bg-transparent text-[14px] text-foreground outline-none"
          />
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={save}
            disabled={!isDirty}
            className="text-muted-foreground"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={cancel}
            className="text-muted-foreground"
          >
            ✕
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group/btn relative">
      {copiedBubble}
      <button
        onClick={filled ? copy : startEdit}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-secondary px-3 py-3 text-left transition-colors hover:bg-secondary/70',
          filled ? 'border-border' : 'border-dashed border-border/50',
        )}
      >
        <div
          className={cn(
            'flex size-[30px] flex-shrink-0 items-center justify-center rounded-md',
            iconBg ?? 'bg-secondary',
          )}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-0.5 text-[12px] text-muted-foreground">
            {label}
          </span>
          {saving ? (
            <Skeleton className="h-[21px] w-3/5 bg-surface-selected" />
          ) : splitName && filled && value && value.includes(' ') ? (
            <span className="flex gap-1 text-[14px] text-foreground">
              <span
                onClick={(e) => copyPart(value.slice(0, value.indexOf(' ')), e)}
                className="-mx-0.5 rounded px-0.5 transition-colors hover:bg-secondary"
              >
                {value.slice(0, value.indexOf(' '))}
              </span>
              <span
                onClick={(e) =>
                  copyPart(value.slice(value.indexOf(' ') + 1), e)
                }
                className="-mx-0.5 rounded px-0.5 transition-colors hover:bg-secondary"
              >
                {value.slice(value.indexOf(' ') + 1)}
              </span>
            </span>
          ) : (
            <span
              className={cn(
                'truncate text-[14px]',
                filled ? 'text-foreground' : 'text-muted-foreground/40 italic',
              )}
            >
              {filled ? value : emptyText}
            </span>
          )}
        </div>
      </button>
      <button
        onClick={startEdit}
        className="absolute top-1/2 -right-[11px] z-10 flex size-[24px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary shadow-sm transition-colors hover:bg-surface-selected"
      >
        <Pencil size={13} className="text-muted-foreground" />
      </button>
    </div>
  )
}
