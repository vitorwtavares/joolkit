import { useState, useRef, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EmptyCell } from './EmptyCell'

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
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  // items: index 0 = Clear, 1..n = options
  const totalItems = 1 + options.length

  function select(v: T | null) {
    onSave(v)
    setOpen(false)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setHighlighted(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      if (highlighted === 0) select(null)
      else select(options[highlighted - 1].value)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (highlighted < 0) return
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const displayLabel =
    value != null
      ? (options.find((o) => o.value === value)?.label ?? value)
      : null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer items-center px-3 text-left text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        >
          {renderDisplay ? (
            renderDisplay(value)
          ) : displayLabel != null ? (
            <span>{displayLabel}</span>
          ) : (
            <EmptyCell />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-40 p-1"
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
          <button
            type="button"
            onClick={() => select(null)}
            className={`flex h-[34px] w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-[14px] text-white/50 transition-colors ${
              highlighted === 0
                ? 'bg-[rgba(255,255,255,0.06)]'
                : 'hover:bg-[rgba(255,255,255,0.06)]'
            }`}
          >
            — Clear
          </button>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`flex h-[34px] w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-[14px] transition-colors ${
                highlighted === i + 1
                  ? 'bg-[rgba(255,255,255,0.06)]'
                  : 'hover:bg-[rgba(255,255,255,0.06)]'
              }`}
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
