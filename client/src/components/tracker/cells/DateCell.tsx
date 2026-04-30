import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Calendar } from '@/components/ui/calendar'
import { EmptyCell } from './EmptyCell'

interface DateCellProps {
  value: string | null
  onSave: (value: string | null) => void
}

function isoToDate(iso: string | null): Date | undefined {
  if (!iso) return undefined
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateToIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplay(iso: string | null): string {
  if (!iso) return '—'
  const d = isoToDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTooltip(iso: string | null): string | null {
  if (!iso) return null
  const d = isoToDate(iso)
  if (!d) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DateCell({ value, onSave }: DateCellProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(date: Date | undefined) {
    onSave(date ? dateToIso(date) : null)
    setOpen(false)
  }

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute inset-0 flex cursor-pointer items-center px-3 text-left text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            >
              {value ? formatDisplay(value) : <EmptyCell />}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        {value && <TooltipContent>{formatTooltip(value)}</TooltipContent>}
        <PopoverContent
          align="start"
          className="w-auto p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            selected={isoToDate(value)}
            onSelect={handleSelect}
            autoFocus
          />
          {value && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => handleSelect(undefined)}
                className="w-full cursor-pointer rounded px-2 py-1.5 text-[14px] text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              >
                Clear
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </Tooltip>
  )
}
