import { useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { CellTrigger } from './CellTrigger'
import { StatusBadge } from '../StatusBadge'
import { STATUS_CONFIG } from '../statusConfig'
import type { ApplicationStatus } from '@/api/hooks/useApplications'

interface StatusCellProps {
  value: ApplicationStatus
  onSave: (value: ApplicationStatus) => void
  inline?: boolean
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[]

export function StatusCell({ value, onSave, inline = false }: StatusCellProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const {
    open,
    setOpen,
    handleOpenChange,
    handleKeyDown,
    focusListOnOpen,
    itemClass,
  } = useKeyboardNav({
    totalItems: ALL_STATUSES.length,
    listRef,
    onEnter: (i) => select(ALL_STATUSES[i]),
  })

  function select(status: ApplicationStatus) {
    onSave(status)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {inline ? (
          <button
            type="button"
            className="cursor-pointer rounded px-1.5 py-1 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
          >
            <StatusBadge status={value} />
          </button>
        ) : (
          <CellTrigger>
            <StatusBadge status={value} />
          </CellTrigger>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-48 gap-0 p-1"
        onOpenAutoFocus={focusListOnOpen}
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
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(i)}`}
            >
              <StatusBadge status={status} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
