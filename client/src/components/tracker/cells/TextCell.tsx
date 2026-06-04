import { useState, useRef } from 'react'
import { EmptyCell } from './EmptyCell'
import { sanitizeUrl } from '@/utils/sanitizeUrl'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOverflowTooltip } from '@/hooks/useOverflowTooltip'

interface TextCellProps {
  value: string | null
  onSave: (value: string | null) => void
  onCommit?: () => void
  url?: string | null
  bold?: boolean
  className?: string
  linkClassName?: string
  maxLength?: number
  onEditingChange?: (editing: boolean) => void
}

export function TextCell({
  value,
  onSave,
  onCommit,
  url,
  bold,
  className = '',
  linkClassName,
  maxLength,
  onEditingChange,
}: TextCellProps) {
  const safeUrl = url ? sanitizeUrl(url) : null
  const [editing, setEditing] = useState(false)
  const innerRef = useRef<HTMLElement | null>(null)
  const { isOverflowing, check, reset } = useOverflowTooltip()

  function commitAndExit() {
    const trimmed = value?.trim() ?? ''
    if (trimmed !== (value ?? '')) onSave(trimmed || null)
    onCommit?.()
    setEditing(false)
    onEditingChange?.(false)
  }

  if (editing) {
    return (
      <div className={`absolute inset-0 flex items-center px-3 ${className}`}>
        <input
          name="tracker-text-cell"
          autoFocus
          value={value ?? ''}
          onChange={(e) => onSave(e.target.value || null)}
          onBlur={commitAndExit}
          maxLength={maxLength}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
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
          onClick={() => {
            setEditing(true)
            onEditingChange?.(true)
          }}
          onMouseEnter={() => {
            if (value) check(innerRef.current)
          }}
          onMouseLeave={reset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setEditing(true)
              onEditingChange?.(true)
            }
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
