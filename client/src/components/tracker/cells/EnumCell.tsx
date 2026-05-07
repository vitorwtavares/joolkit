import { useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { CellTrigger } from './CellTrigger'
import { EmptyCell } from './EmptyCell'
import { POPOVER_ITEM_CLASS } from '../styles'

interface EnumOption<T extends string> {
  value: T
  label: string
  color?: string
}

interface EnumCellProps<T extends string> {
  value: T | null
  options: EnumOption<T>[]
  renderDisplay?: (value: T | null) => React.ReactNode
  onSave: (value: T | null) => void
}

export function EnumCell<T extends string>({
  value,
  options,
  renderDisplay,
  onSave,
}: EnumCellProps<T>) {
  // items: index 0 = Clear, 1..n = options
  const listRef = useRef<HTMLDivElement>(null)
  const {
    open,
    setOpen,
    handleOpenChange,
    handleKeyDown,
    focusListOnOpen,
    itemClass,
  } = useKeyboardNav({
    totalItems: 1 + options.length,
    listRef,
    onEnter: (i) => select(i === 0 ? null : options[i - 1].value),
  })

  function select(v: T | null) {
    onSave(v)
    setOpen(false)
  }

  const displayLabel =
    value != null
      ? (options.find((o) => o.value === value)?.label ?? value)
      : null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <CellTrigger>
          {renderDisplay ? (
            renderDisplay(value)
          ) : displayLabel != null ? (
            <span>{displayLabel}</span>
          ) : (
            <EmptyCell />
          )}
        </CellTrigger>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-40 p-1"
        onOpenAutoFocus={focusListOnOpen}
      >
        <div
          ref={listRef}
          tabIndex={-1}
          className="outline-none"
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            onClick={() => select(null)}
            className={`${POPOVER_ITEM_CLASS} gap-2 text-white/50 ${itemClass(0)}`}
          >
            — Clear
          </button>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`${POPOVER_ITEM_CLASS} gap-2 ${itemClass(i + 1)}`}
              style={{ color: opt.color ?? 'var(--foreground)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
