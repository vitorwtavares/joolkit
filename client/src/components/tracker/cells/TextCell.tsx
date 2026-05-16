import { useState, useEffect, useRef } from 'react'
import { EmptyCell } from './EmptyCell'
import { sanitizeUrl } from '@/utils/sanitizeUrl'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOverflowTooltip } from '@/hooks/useOverflowTooltip'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'

interface TextCellProps {
  value: string | null
  onSave: (value: string | null) => void
  url?: string | null
  bold?: boolean
  className?: string
  linkClassName?: string
  maxLength?: number
}

export function TextCell({
  value,
  onSave,
  url,
  bold,
  className = '',
  linkClassName,
  maxLength,
}: TextCellProps) {
  const safeUrl = url ? sanitizeUrl(url) : null
  const [editing, setEditing] = useState(false)
  const { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule } =
    useDebouncedSave(value, onSave)
  const innerRef = useRef<HTMLElement | null>(null)
  const { isOverflowing, check, reset } = useOverflowTooltip()

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
    schedule(draft.trim() || null)
    return cancelTimer
  }, [cancelTimer, draft, editing, schedule])

  if (editing) {
    return (
      <div className={`absolute inset-0 flex items-center px-3 ${className}`}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={confirmAndExit}
          maxLength={maxLength}
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
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          onClick={startEdit}
          onMouseEnter={() => {
            if (value) check(innerRef.current)
          }}
          onMouseLeave={reset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') startEdit()
          }}
          className={`absolute inset-0 flex cursor-text items-center overflow-hidden px-3 text-[14px] transition-colors hover:bg-surface-hover-subtle ${className}`}
          style={{ fontWeight: bold ? 500 : undefined }}
        >
          {safeUrl && value ? (
            <a
              ref={(el) => {
                innerRef.current = el
              }}
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'truncate transition-colors hover:text-foreground/80',
                linkClassName,
              )}
            >
              {value}
            </a>
          ) : (
            <span
              ref={(el) => {
                innerRef.current = el
              }}
              className="truncate"
            >
              {value ?? <EmptyCell />}
            </span>
          )}
        </span>
      </TooltipTrigger>
      {isOverflowing && value && (
        <TooltipContent side="top" className="max-w-[250px] pr-4">
          <span className="min-w-0 break-words">{value}</span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
