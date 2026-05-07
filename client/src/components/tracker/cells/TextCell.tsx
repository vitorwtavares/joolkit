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
  const [committedDisplayValue, setCommittedDisplayValue] = useState<
    string | null | undefined
  >(undefined)
  const { draft, setDraft, lastSavedRef, cancelTimer, flushSave, schedule } =
    useDebouncedSave(value, onSave)
  const innerRef = useRef<HTMLElement | null>(null)
  const committedDisplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const { isOverflowing, check, reset } = useOverflowTooltip()
  const displayValue =
    committedDisplayValue !== undefined ? committedDisplayValue : value

  function clearCommittedDisplay() {
    if (committedDisplayTimerRef.current) {
      clearTimeout(committedDisplayTimerRef.current)
      committedDisplayTimerRef.current = null
    }
    setCommittedDisplayValue(undefined)
  }

  function holdCommittedDisplay(next: string | null) {
    if (committedDisplayTimerRef.current) {
      clearTimeout(committedDisplayTimerRef.current)
    }
    setCommittedDisplayValue(next)
    committedDisplayTimerRef.current = setTimeout(() => {
      committedDisplayTimerRef.current = null
      setCommittedDisplayValue(undefined)
    }, 300)
  }

  function startEdit() {
    setDraft(displayValue ?? '')
    lastSavedRef.current = displayValue
    setEditing(true)
  }

  function confirmAndExit() {
    cancelTimer()
    const next = draft.trim() || null
    if (next !== value) holdCommittedDisplay(next)
    else clearCommittedDisplay()
    flushSave(next)
    setEditing(false)
  }

  useEffect(() => {
    if (!editing) return
    schedule(draft.trim() || null)
    return cancelTimer
  }, [cancelTimer, draft, editing, schedule])

  useEffect(() => {
    return () => {
      if (committedDisplayTimerRef.current) {
        clearTimeout(committedDisplayTimerRef.current)
      }
    }
  }, [])

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
            if (displayValue) check(innerRef.current)
          }}
          onMouseLeave={reset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') startEdit()
          }}
          className={`absolute inset-0 flex cursor-text items-center overflow-hidden px-3 text-[14px] transition-colors hover:bg-surface-hover-subtle ${className}`}
          style={{ fontWeight: bold ? 500 : undefined }}
        >
          {safeUrl && displayValue ? (
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
              {displayValue}
            </a>
          ) : (
            <span
              ref={(el) => {
                innerRef.current = el
              }}
              className="truncate"
            >
              {displayValue ?? <EmptyCell />}
            </span>
          )}
        </span>
      </TooltipTrigger>
      {isOverflowing && displayValue && (
        <TooltipContent side="top" className="max-w-[250px] pr-4">
          <span className="min-w-0 break-words">{displayValue}</span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
