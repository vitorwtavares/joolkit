import { useState } from 'react'
import { Check, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TOGGLEABLE_COLUMNS, isColumnVisible } from '../table/columns'

interface ColumnsControlProps {
  value: string[] | null
  // An empty selection clears the view's hidden columns entirely (null).
  onChange: (next: string[] | null) => void
}

export function ColumnsControl({ value, onChange }: ColumnsControlProps) {
  const [open, setOpen] = useState(false)
  const hasHidden = TOGGLEABLE_COLUMNS.some(
    (c) => !isColumnVisible(c.key, value),
  )

  function toggle(key: string) {
    const hidden = new Set(value ?? [])
    if (hidden.has(key)) hidden.delete(key)
    else hidden.add(key)
    // Persist in column order so the stored list stays stable and predictable.
    const next = TOGGLEABLE_COLUMNS.filter((c) => hidden.has(c.key)).map(
      (c) => c.key,
    )
    onChange(next.length ? next : null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Columns"
          className={cn(
            'relative max-[1599px]:size-8 max-[1599px]:px-0',
            hasHidden && 'border-brand/40',
          )}
        >
          <Columns3 size={14} />
          <span className="hidden min-[1600px]:inline">Columns</span>
          {hasHidden && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 size-2 rounded-full bg-brand ring-2 ring-background"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-0 p-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <span className="text-[13px] font-medium text-muted-foreground">
            Visible columns
          </span>
          {hasHidden && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Show all
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {TOGGLEABLE_COLUMNS.map((col) => {
            const visible = isColumnVisible(col.key, value)
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => toggle(col.key)}
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-between rounded px-2 text-[14px] transition-colors hover:bg-muted',
                  visible ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {col.label}
                {visible && <Check size={14} className="text-brand" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
