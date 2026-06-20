import { useState } from 'react'
import { Check, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { Tag } from '../Tag'
import type { AnswerFilterConfig } from '../answerFilter'

interface AnswerFilterControlProps {
  value: AnswerFilterConfig | null
  availableTags: string[]
  // A null filter clears the filter entirely.
  onApply: (next: AnswerFilterConfig | null) => void
}

const OPERATOR_OPTIONS: {
  value: AnswerFilterConfig['operator']
  label: string
}[] = [
  { value: 'is', label: 'Includes' },
  { value: 'is_not', label: 'Excludes' },
]

export function AnswerFilterControl({
  value,
  availableTags,
  onApply,
}: AnswerFilterControlProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Filter"
          className={cn(
            'relative max-[1599px]:size-8 max-[1599px]:px-0',
            value && 'border-brand/40',
          )}
        >
          <Filter size={14} />
          <span className="hidden min-[1600px]:inline">Filter</span>
          {value && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 size-2 rounded-full bg-brand ring-2 ring-background"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <FilterPanel
          value={value}
          availableTags={availableTags}
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

// Equal operator and tag set (order is not significant).
function sameFilter(
  a: AnswerFilterConfig | null,
  b: AnswerFilterConfig | null,
): boolean {
  if (!a || !b) return a === b
  if (a.operator !== b.operator) return false
  if (a.tags.length !== b.tags.length) return false
  const set = new Set(b.tags)
  return a.tags.every((t) => set.has(t))
}

interface FilterPanelProps extends AnswerFilterControlProps {
  onClose: () => void
}

function FilterPanel({
  value,
  availableTags,
  onApply,
  onClose,
}: FilterPanelProps) {
  const [operator, setOperator] = useState<AnswerFilterConfig['operator']>(
    value?.operator === 'is_not' ? 'is_not' : 'is',
  )
  const [tags, setTags] = useState<string[]>(value?.tags ?? [])

  const draft: AnswerFilterConfig | null = tags.length
    ? { operator, tags }
    : null
  const dirty = !sameFilter(draft, value)
  const canApply = tags.length > 0 && dirty

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function clear() {
    onApply(null)
    onClose()
  }

  function apply() {
    onApply(draft)
    onClose()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-[13px] font-medium text-muted-foreground">
          Filter by tags
        </span>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {availableTags.length === 0 ? (
        <p className="px-1 py-3 text-[12.5px] text-muted-foreground">
          No tags yet. Add tags to your answers to filter by them.
        </p>
      ) : (
        <>
          <SegmentedToggle<AnswerFilterConfig['operator']>
            variant="compact"
            fullWidth
            value={operator}
            options={OPERATOR_OPTIONS}
            onChange={setOperator}
          />

          <div className="flex min-h-7 flex-wrap items-center gap-1 px-1">
            {tags.length === 0 ? (
              <span className="text-[12px] text-muted-foreground">
                No tags selected
              </span>
            ) : (
              tags.map((tag) => (
                <Tag key={tag} onRemove={() => toggleTag(tag)}>
                  {tag}
                </Tag>
              ))
            )}
          </div>

          <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto border-t border-border-subtle pt-1">
            {availableTags.map((tag) => {
              const isSelected = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'flex h-8 cursor-pointer items-center justify-between gap-2 rounded px-2 text-[14px] transition-colors hover:bg-muted',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span className="truncate">{tag}</span>
                  {isSelected && (
                    <Check size={14} className="shrink-0 text-brand" />
                  )}
                </button>
              )
            })}
          </div>

          <Button
            size="sm"
            disabled={!canApply}
            onClick={apply}
            className="mt-1 w-full"
          >
            Apply
          </Button>
        </>
      )}
    </div>
  )
}
