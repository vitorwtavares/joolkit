import { useState } from 'react'
import { ArrowDownUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import {
  ANSWER_SORTABLE_FIELDS,
  defaultDirection,
  directionLabels,
  type AnswerSortConfig,
  type SortDirection,
} from '../answerSort'

interface AnswerSortControlProps {
  value: AnswerSortConfig | null
  onChange: (next: AnswerSortConfig | null) => void
}

export function AnswerSortControl({ value, onChange }: AnswerSortControlProps) {
  const [open, setOpen] = useState(false)
  const activeField = value
    ? ANSWER_SORTABLE_FIELDS.find((f) => f.field === value.field)
    : undefined
  const labels = activeField
    ? directionLabels(activeField.type)
    : { asc: 'Asc', desc: 'Desc' }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Sort"
          className={cn(
            'relative max-[1599px]:size-8 max-[1599px]:px-0',
            value && 'border-brand/40',
          )}
        >
          <ArrowDownUp size={14} />
          <span className="hidden min-[1600px]:inline">Sort</span>
          {value && (
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
            Sort by
          </span>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Always shown (disabled until a field is picked) to keep the popover
            height stable. */}
        <SegmentedToggle<SortDirection>
          variant="compact"
          fullWidth
          disabled={!value}
          value={value?.direction ?? 'asc'}
          options={[
            { value: 'asc', label: labels.asc },
            { value: 'desc', label: labels.desc },
          ]}
          onChange={(direction) =>
            value && onChange({ field: value.field, direction })
          }
        />

        <div className="mt-2 flex flex-col border-t border-border-subtle pt-2">
          {ANSWER_SORTABLE_FIELDS.map((f) => {
            const isActive = value?.field === f.field
            return (
              <button
                key={f.field}
                type="button"
                onClick={() =>
                  onChange({
                    field: f.field,
                    direction: isActive
                      ? value!.direction
                      : defaultDirection(f.type),
                  })
                }
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-between rounded px-2 text-[14px] transition-colors hover:bg-muted',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {f.label}
                {isActive && <Check size={14} className="text-brand" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
