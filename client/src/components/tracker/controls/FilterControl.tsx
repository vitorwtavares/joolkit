import { useState } from 'react'
import { Check, ChevronDown, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import type { ApplicationStatus } from '@/api/hooks/useApplications'
import type { FilterConfig } from '@/api/hooks/useTrackerViews'
import { STATUS_CONFIG } from '../status/statusConfig'
import { Badge } from '../status/Badge'

interface FilterControlProps {
  value: FilterConfig | null
  // A null filter clears the view's filter entirely.
  onApply: (next: FilterConfig | null) => void
}

// STATUS_CONFIG is declared in pipeline order, so its key order is the order we
// list statuses in the picker.
const STATUS_OPTIONS = Object.keys(STATUS_CONFIG) as ApplicationStatus[]

const OPERATOR_OPTIONS: { value: FilterConfig['operator']; label: string }[] = [
  { value: 'is', label: 'Includes' },
  { value: 'is_not', label: 'Excludes' },
]

const FAVORITE_OPERATOR_OPTIONS: {
  value: FilterConfig['operator']
  label: string
}[] = [
  { value: 'is', label: 'Favorites' },
  { value: 'is_not', label: 'Not favorites' },
]

const FILTER_FIELDS: { value: FilterConfig['field']; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'is_favorite', label: 'Favorites' },
]

export function FilterControl({ value, onApply }: FilterControlProps) {
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
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

// Equal field, operator, and value set (value order is not significant).
function sameFilter(a: FilterConfig | null, b: FilterConfig | null): boolean {
  if (!a || !b) return a === b
  if (a.field !== b.field || a.operator !== b.operator) return false
  if (a.values.length !== b.values.length) return false
  const set = new Set(b.values)
  return a.values.every((v) => set.has(v))
}

interface FilterPanelProps extends FilterControlProps {
  onClose: () => void
}

function FilterPanel({ value, onApply, onClose }: FilterPanelProps) {
  const [field, setField] = useState<FilterConfig['field']>(
    value?.field ?? 'status',
  )
  const statusFilter = value?.field === 'status' ? value : null
  const [operator, setOperator] = useState<FilterConfig['operator']>(
    value?.operator === 'is_not' ? 'is_not' : 'is',
  )
  const [statuses, setStatuses] = useState<ApplicationStatus[]>(
    statusFilter ? (statusFilter.values as ApplicationStatus[]) : [],
  )
  const fieldLabel =
    FILTER_FIELDS.find((option) => option.value === field)?.label ?? 'Status'

  const draft: FilterConfig | null =
    field === 'status'
      ? statuses.length
        ? { field: 'status', operator, values: statuses }
        : null
      : { field: 'is_favorite', operator, values: [true] }
  const dirty = !sameFilter(draft, value)
  const canApply = field === 'status' ? statuses.length > 0 && dirty : dirty

  function toggleStatus(status: ApplicationStatus) {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
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
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          Filter by
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-0.5 rounded-md bg-secondary px-1.5 py-0.5 text-foreground transition-colors hover:bg-muted"
              >
                {fieldLabel}
                <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuRadioGroup
                value={field}
                onValueChange={(next) =>
                  setField(next as FilterConfig['field'])
                }
              >
                {FILTER_FIELDS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      <SegmentedToggle<FilterConfig['operator']>
        variant="compact"
        fullWidth
        value={operator}
        options={
          field === 'status' ? OPERATOR_OPTIONS : FAVORITE_OPERATOR_OPTIONS
        }
        onChange={setOperator}
      />

      {field === 'status' ? (
        <>
          <div className="flex min-h-7 flex-wrap items-center gap-1 px-1">
            {statuses.length === 0 ? (
              <span className="text-[12px] text-muted-foreground">
                No statuses selected
              </span>
            ) : (
              statuses.map((s) => (
                <Badge
                  key={s}
                  bg={STATUS_CONFIG[s].bg}
                  className="gap-1 ps-2.5 pe-1"
                >
                  {STATUS_CONFIG[s].label}
                  <button
                    type="button"
                    onClick={() => toggleStatus(s)}
                    aria-label={`Remove ${STATUS_CONFIG[s].label}`}
                    className="flex cursor-pointer items-center justify-center rounded opacity-70 transition-opacity hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto border-t border-border-subtle pt-1">
            {STATUS_OPTIONS.map((status) => {
              const isSelected = statuses.includes(status)
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-[14px] transition-colors hover:bg-muted',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2.5 flex-shrink-0 rounded-full"
                    style={{ background: STATUS_CONFIG[status].fg }}
                  />
                  <span className="flex-1 text-left">
                    {STATUS_CONFIG[status].label}
                  </span>
                  {isSelected && <Check size={14} className="text-brand" />}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="border-t border-border-subtle px-1 pt-3 pb-2">
          <p className="text-[12.5px] leading-5 text-muted-foreground">
            {operator === 'is'
              ? 'Only entries marked as favorite will be shown.'
              : 'Entries marked as favorite will be hidden.'}
          </p>
        </div>
      )}

      <Button
        size="sm"
        disabled={!canApply}
        onClick={apply}
        className="mt-1 w-full"
      >
        Apply
      </Button>
    </div>
  )
}
