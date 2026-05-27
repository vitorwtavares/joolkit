import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
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
  locked?: boolean
  onSave: (value: string) => Promise<void>
}

export function CopyButton({
  label,
  value,
  icon,
  iconBg,
  emptyText,
  splitName,
  locked = false,
  onSave,
}: CopyButtonProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { trigger: triggerCopied, bubble: copiedBubble } = useCopiedBubble()
  const filled = !!value?.trim()
  const fieldId = `quick-copy-${label.toLowerCase().replace(/\s+/g, '-')}`

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
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3.5">
        <div
          className={cn(
            'flex size-[32px] flex-shrink-0 items-center justify-center rounded-md',
            iconBg ?? 'bg-secondary',
          )}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-1 text-[11px] font-medium tracking-[0.04em] text-text-faint uppercase">
            {label}
          </span>
          <input
            ref={inputRef}
            id={fieldId}
            name={fieldId}
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
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={save}
            disabled={!isDirty}
            aria-label="Save"
            className="inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-md bg-success-soft-strong px-2 text-[11px] text-success transition-colors hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-success-soft-strong"
          >
            <Check size={11} />
            <span className="hidden min-[1551px]:inline">Save</span>
          </button>
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel"
            className="flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-danger-soft-fill text-danger transition-colors hover:bg-danger/25"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  const disabled = !filled && locked
  const primaryAction = filled ? copy : startEdit

  return (
    <div className="group/btn relative">
      {copiedBubble}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={disabled ? undefined : primaryAction}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            primaryAction()
          }
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3.5 text-left transition-colors outline-none hover:border-border-strong hover:bg-secondary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          filled
            ? 'cursor-pointer border-border'
            : locked
              ? 'cursor-default border-border/60 bg-card/40'
              : 'cursor-pointer border-border/60 bg-card/40',
        )}
      >
        <div
          className={cn(
            'flex size-[32px] flex-shrink-0 items-center justify-center rounded-md transition-colors',
            iconBg ?? 'bg-secondary',
            filled && 'group-hover/btn:text-brand',
          )}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-1 text-[11px] font-medium tracking-[0.04em] text-text-faint uppercase">
            {label}
          </span>
          {saving ? (
            <Skeleton className="h-[21px] w-3/5 bg-surface-selected" />
          ) : splitName && filled && value && value.includes(' ') ? (
            <span className="flex gap-1 text-[14px] text-foreground">
              <span
                onClick={(e) => copyPart(value.slice(0, value.indexOf(' ')), e)}
                className="-mx-0.5 cursor-pointer rounded px-0.5 py-0.5 transition-colors hover:bg-brand-soft hover:text-brand"
              >
                {value.slice(0, value.indexOf(' '))}
              </span>
              <span
                onClick={(e) =>
                  copyPart(value.slice(value.indexOf(' ') + 1), e)
                }
                className="-mx-0.5 cursor-pointer rounded px-0.5 py-0.5 transition-colors hover:bg-brand-soft hover:text-brand"
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
        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/btn:opacity-100">
          {filled && (
            <span
              className="inline-flex h-[26px] items-center gap-1.5 rounded-md bg-brand-soft px-2 text-[11px] text-brand transition-colors hover:bg-brand/25"
              aria-hidden
            >
              <Copy size={11} />
              <span className="hidden min-[1551px]:inline">Copy</span>
            </span>
          )}
          {!locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                startEdit()
              }}
              aria-label="Edit"
              className="flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-brand-soft text-brand transition-colors hover:bg-brand/25"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
