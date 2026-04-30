import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyCell } from './EmptyCell'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useLocations,
  useCreateLocation,
  useDeleteLocation,
} from '@/api/hooks/useLocations'

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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLButtonElement>(null)
  const { data: locations = [] } = useLocations()
  const createLocation = useCreateLocation()
  const deleteLocation = useDeleteLocation()

  const remoteLocation = useMemo(
    () => locations.find(isRemote) ?? null,
    [locations],
  )

  const filteredOthers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return locations
      .filter((l) => !isRemote(l))
      .filter((l) => !q || l.name.toLowerCase().includes(q))
  }, [locations, search])

  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase()
    return locations.some((l) => l.name.toLowerCase() === q)
  }, [locations, search])

  // Compute flat nav index offsets
  const clearIdx = value !== null ? 0 : -1
  const remoteIdx = remoteLocation ? (value !== null ? 1 : 0) : -1
  const othersStart = (value !== null ? 1 : 0) + (remoteLocation ? 1 : 0)
  const createIdx =
    search.trim() && !exactMatch ? othersStart + filteredOthers.length : -1
  const totalItems =
    othersStart + filteredOthers.length + (createIdx >= 0 ? 1 : 0)

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault()
        if (highlighted === clearIdx) select(null)
        else if (highlighted === remoteIdx) select(remoteLocation!.id)
        else if (
          highlighted >= othersStart &&
          highlighted < othersStart + filteredOthers.length
        )
          select(filteredOthers[highlighted - othersStart].id)
        else if (highlighted === createIdx) handleCreate()
      } else if (!exactMatch && search.trim()) {
        handleCreate()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (highlighted < 0) return
    if (highlighted === createIdx) {
      createRef.current?.scrollIntoView({ block: 'nearest' })
    } else {
      const el = scrollRef.current?.children[highlighted] as
        | HTMLElement
        | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted, createIdx])

  function itemClass(idx: number) {
    return highlighted === idx ? 'bg-[rgba(255,255,255,0.06)]' : ''
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setSearch('')
          setHighlighted(-1)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer items-center px-3 text-left text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        >
          {value?.name ?? <EmptyCell />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-52 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <input
          autoFocus
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setHighlighted(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search or create..."
          className="mb-1 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div ref={scrollRef} className="max-h-56 overflow-y-auto pr-1">
          {value !== null && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => select(null)}
              className={`flex h-[34px] w-full cursor-pointer items-center rounded px-2 text-left text-[14px] text-white/50 transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(clearIdx)}`}
            >
              — Clear
            </button>
          )}

          {remoteLocation && (
            <div
              className={`group flex items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(remoteIdx)}`}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => select(remoteLocation.id)}
                className="flex min-h-[34px] flex-1 cursor-pointer items-center px-2 py-2 text-left text-[14px] text-foreground"
              >
                {remoteLocation.name}
              </button>
            </div>
          )}

          {filteredOthers.map((loc, i) => (
            <div
              key={loc.id}
              className={`group flex items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(othersStart + i)}`}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => select(loc.id)}
                className="flex min-h-[34px] flex-1 cursor-pointer items-center px-2 py-2 text-left text-[14px] text-foreground"
              >
                {loc.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(loc)
                }}
                aria-label={`Delete ${loc.name}`}
                tabIndex={-1}
                className="mr-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded text-white/30 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.05)] hover:text-destructive"
              >
                <Trash2
                  size={15}
                  className="text-[#b0b0aa] transition-colors hover:text-destructive"
                />
              </button>
            </div>
          ))}
        </div>

        {search.trim() && !exactMatch && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleCreate}
            disabled={createLocation.isPending}
            ref={createRef}
            className={`flex h-[34px] w-full cursor-pointer items-center gap-1.5 rounded px-2 text-left text-[14px] text-white/50 transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50 ${createIdx >= 0 ? itemClass(createIdx) : ''}`}
          >
            <Plus size={12} />
            Create &ldquo;{search.trim()}&rdquo;
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
