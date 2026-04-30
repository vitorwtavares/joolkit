import { useState, useRef, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { StatusBadge } from '../StatusBadge'
import { STATUS_CONFIG } from '../statusConfig'
import type { ApplicationStatus } from '@/api/hooks/useApplications'

interface StatusCellProps {
  value: ApplicationStatus
  onSave: (value: ApplicationStatus) => void
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[]

export function StatusCell({ value, onSave }: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  function select(status: ApplicationStatus) {
    onSave(status)
    setOpen(false)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setHighlighted(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, ALL_STATUSES.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      select(ALL_STATUSES[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (highlighted < 0) return
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer items-center px-3 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        >
          <StatusBadge status={value} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-48 gap-0 p-1"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          listRef.current?.focus()
        }}
      >
        <div
          ref={listRef}
          tabIndex={-1}
          className="outline-none"
          onKeyDown={handleKeyDown}
        >
          {ALL_STATUSES.map((status, i) => (
            <button
              key={status}
              type="button"
              onClick={() => select(status)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                i === highlighted
                  ? 'bg-[rgba(255,255,255,0.06)]'
                  : 'hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <StatusBadge status={status} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
