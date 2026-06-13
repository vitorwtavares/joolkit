import { useState, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyCell } from './EmptyCell'
import { CellTrigger } from './CellTrigger'
import { PopoverListRow } from './PopoverListRow'
import { INPUT_BASE, POPOVER_ITEM_CLASS } from '../styles'
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
import { TruncatedText } from '@/components/ui/truncated-text'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { useOverflowTooltip } from '@/hooks/useOverflowTooltip'
import {
  useLocations,
  useCreateLocation,
  useDeleteLocation,
} from '@/api/hooks/useLocations'
import { normalizeForSearch } from '@/utils/normalizeForSearch'

interface LocationRef {
  id: string
  name: string
}

interface LocationCellProps {
  value: LocationRef | null
  onSave: (locationId: string | null) => void
}

function isRemote(loc: LocationRef) {
  return loc.name.toLowerCase() === 'remote'
}

export function LocationCell({ value, onSave }: LocationCellProps) {
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLButtonElement>(null)
  const createTextRef = useRef<HTMLSpanElement>(null)
  const triggerTextRef = useRef<HTMLSpanElement>(null)
  const { data: locations = [] } = useLocations()
  const createLocation = useCreateLocation()
  const deleteLocation = useDeleteLocation()

  const {
    isOverflowing: triggerOverflow,
    check: checkTrigger,
    reset: resetTrigger,
  } = useOverflowTooltip()
  const {
    isOverflowing: createOverflow,
    check: checkCreate,
    reset: resetCreate,
  } = useOverflowTooltip()

  const remoteLocation = useMemo(
    () => locations.find(isRemote) ?? null,
    [locations],
  )

  const filteredOthers = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    return locations
      .filter((l) => !isRemote(l))
      .filter((l) => !q || normalizeForSearch(l.name).includes(q))
  }, [locations, search])

  const exactMatch = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    return locations.some((l) => normalizeForSearch(l.name) === q)
  }, [locations, search])

  const clearIdx = value !== null ? 0 : -1
  const remoteIdx = remoteLocation ? (value !== null ? 1 : 0) : -1
  const othersStart = (value !== null ? 1 : 0) + (remoteLocation ? 1 : 0)
  const createIdx =
    search.trim() && !exactMatch ? othersStart + filteredOthers.length : -1
  const totalItems =
    othersStart + filteredOthers.length + (createIdx >= 0 ? 1 : 0)

  const {
    open,
    setOpen,
    setHighlighted,
    handleOpenChange,
    handleKeyDown,
    itemClass,
  } = useKeyboardNav({
    totalItems,
    listRef,
    onEnter: (i) => {
      if (i === clearIdx) select(null)
      else if (i === remoteIdx) select(remoteLocation!.id)
      else if (i >= othersStart && i < othersStart + filteredOthers.length)
        select(filteredOthers[i - othersStart].id)
      else if (i === createIdx) handleCreate()
    },
    onSearchEnter: () => {
      if (!exactMatch && search.trim()) handleCreate()
    },
    resolveExtraScrollTarget: (i) =>
      i === createIdx ? createRef.current : null,
  })

  function select(locationId: string | null) {
    onSave(locationId)
    setOpen(false)
    setSearch('')
  }

  function handleCreate() {
    const name = search.trim()
    if (!name) return
    createLocation.mutate(name, {
      onSuccess: (loc) => select(loc.id),
    })
  }

  function handleDelete(loc: LocationRef) {
    deleteLocation.mutate(loc.id, {
      onError: () => toast.error('Failed to delete location'),
    })
  }

  return (
    <Tooltip>
      <Popover
        open={open}
        onOpenChange={(v) => {
          handleOpenChange(v)
          if (!v) setSearch('')
        }}
      >
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <CellTrigger
              className="overflow-hidden"
              onMouseEnter={() => checkTrigger(triggerTextRef.current)}
              onMouseLeave={resetTrigger}
            >
              <span ref={triggerTextRef} className="min-w-0 truncate">
                {value?.name ?? <EmptyCell />}
              </span>
            </CellTrigger>
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent
          align="start"
          className="w-52 p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <input
            name="tracker-location-search"
            autoFocus
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setHighlighted(-1)
            }}
            onKeyDown={handleKeyDown}
            maxLength={50}
            placeholder="Search or create..."
            className={`mb-1 w-full ${INPUT_BASE}`}
          />

          <div ref={listRef} className="max-h-56 overflow-y-auto pr-1">
            {value !== null && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => select(null)}
                className={`${POPOVER_ITEM_CLASS} text-white/50 ${itemClass(clearIdx)}`}
              >
                — Clear
              </button>
            )}

            {remoteLocation && (
              <PopoverListRow className={itemClass(remoteIdx)}>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => select(remoteLocation.id)}
                  className="flex min-h-[34px] flex-1 cursor-pointer items-center overflow-hidden px-2 py-2 text-left text-[14px] text-foreground"
                >
                  <TruncatedText>{remoteLocation.name}</TruncatedText>
                </button>
              </PopoverListRow>
            )}

            {filteredOthers.map((loc, i) => (
              <PopoverListRow
                key={loc.id}
                className={itemClass(othersStart + i)}
                onDelete={() => handleDelete(loc)}
                deleteLabel={`Delete ${loc.name}`}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => select(loc.id)}
                  className="flex min-h-[34px] flex-1 cursor-pointer items-center overflow-hidden px-2 py-2 text-left text-[14px] text-foreground"
                >
                  <TruncatedText>{loc.name}</TruncatedText>
                </button>
              </PopoverListRow>
            ))}
          </div>

          {search.trim() && !exactMatch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleCreate}
                  disabled={createLocation.isPending}
                  ref={createRef}
                  onMouseEnter={() => checkCreate(createTextRef.current)}
                  onMouseLeave={() => resetCreate()}
                  className={`${POPOVER_ITEM_CLASS} gap-1.5 overflow-hidden text-white/50 disabled:opacity-50 ${createIdx >= 0 ? itemClass(createIdx) : ''}`}
                >
                  <Plus size={12} className="flex-shrink-0" />
                  <span ref={createTextRef} className="min-w-0 truncate">
                    Create &ldquo;{search.trim()}&rdquo;
                  </span>
                </button>
              </TooltipTrigger>
              {createOverflow && (
                <TooltipContent side="right" className="max-w-[250px] pr-4">
                  <span className="min-w-0 break-words">{search.trim()}</span>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </PopoverContent>
      </Popover>
      {triggerOverflow && !open && value && (
        <TooltipContent side="top" className="max-w-[250px] pr-4">
          <span className="min-w-0 break-words">{value.name}</span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
