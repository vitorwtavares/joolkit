import { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyCell } from './EmptyCell'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useSkills,
  useCreateSkill,
  useDeleteSkill,
} from '@/api/hooks/useSkills'
import { Badge } from '../Badge'

interface SkillRef {
  id: string
  name: string
}

interface SkillsCellProps {
  value: { skill: SkillRef }[]
  onSave: (skillIds: string[]) => void
}

const SKILL_BG = 'rgba(255,255,255,0.10)'

const COUNTER_W = 30
const GAP = 3

export function SkillsCell({ value, onSave }: SkillsCellProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const { data: allSkills = [] } = useSkills()
  const createSkill = useCreateSkill()
  const deleteSkill = useDeleteSkill()

  const visibleRef = useRef<HTMLSpanElement>(null)
  const measurerRef = useRef<HTMLSpanElement>(null)
  const [visibleCount, setVisibleCount] = useState(value.length)

  useLayoutEffect(() => {
    const visible = visibleRef.current
    const measurer = measurerRef.current
    if (!visible || !measurer) return

    function recalc() {
      if (!visible || !measurer) return
      const containerWidth = visible.clientWidth
      if (containerWidth <= 0) return

      const children = Array.from(measurer.children) as HTMLElement[]
      let used = 0
      let count = 0
      for (let i = 0; i < children.length; i++) {
        const w = children[i].offsetWidth
        const next = used + w + (count > 0 ? GAP : 0)
        const remaining = children.length - 1 - i
        const reserve = remaining > 0 ? COUNTER_W + GAP : 0
        if (next + reserve > containerWidth) break
        used = next
        count++
      }
      setVisibleCount(count)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(visible)
    return () => ro.disconnect()
  }, [value])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allSkills
    return allSkills.filter((s) => s.name.toLowerCase().includes(q))
  }, [allSkills, search])

  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSkills.some((s) => s.name.toLowerCase() === q)
  }, [allSkills, search])

  const selectedIds = useMemo(
    () => new Set(value.map((s) => s.skill.id)),
    [value],
  )

  function toggle(skillId: string) {
    const newIds = selectedIds.has(skillId)
      ? value.filter((s) => s.skill.id !== skillId).map((s) => s.skill.id)
      : [...value.map((s) => s.skill.id), skillId]
    onSave(newIds)
  }

  function handleCreate() {
    const name = search.trim()
    if (!name) return
    createSkill.mutate(name, {
      onSuccess: (skill) => {
        onSave([...value.map((s) => s.skill.id), skill.id])
        setSearch('')
      },
    })
  }

  function handleDeleteSkillOption(skillId: string) {
    deleteSkill.mutate(skillId, {
      onError: () => toast.error('Failed to delete skill'),
    })
  }

  function clearAll() {
    onSave([])
  }

  const clearAllIdx = value.length > 0 ? 0 : -1
  const skillsStart = value.length > 0 ? 1 : 0
  const addIdx =
    search.trim() && !exactMatch ? skillsStart + filtered.length : -1
  const totalItems = skillsStart + filtered.length + (addIdx >= 0 ? 1 : 0)

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
        if (highlighted === clearAllIdx) clearAll()
        else if (
          highlighted >= skillsStart &&
          highlighted < skillsStart + filtered.length
        )
          toggle(filtered[highlighted - skillsStart].id)
        else if (highlighted === addIdx) handleCreate()
      } else if (!exactMatch && search.trim()) {
        handleCreate()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (highlighted < 0) return
    if (highlighted === addIdx) {
      addRef.current?.scrollIntoView({ block: 'nearest' })
    } else {
      const el = scrollRef.current?.children[highlighted] as
        | HTMLElement
        | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted, addIdx])

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
          className="absolute inset-0 flex cursor-pointer items-center pr-8 pl-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        >
          {value.length === 0 ? (
            <EmptyCell />
          ) : (
            <>
              <span
                ref={measurerRef}
                aria-hidden="true"
                className="pointer-events-none invisible absolute top-0 left-0 flex items-center gap-[3px] whitespace-nowrap"
              >
                {value.map(({ skill }) => (
                  <Badge key={skill.id} bg={SKILL_BG}>
                    {skill.name}
                  </Badge>
                ))}
              </span>
              <span
                ref={visibleRef}
                className="flex w-full min-w-0 flex-1 items-center gap-[3px] overflow-hidden"
              >
                {value.slice(0, visibleCount).map(({ skill }) => (
                  <Badge key={skill.id} bg={SKILL_BG}>
                    {skill.name}
                  </Badge>
                ))}
                {value.length > visibleCount && (
                  <span className="inline-flex flex-shrink-0 items-center rounded-md bg-[rgba(255,255,255,0.08)] px-[5px] py-px text-[12px] text-white/60">
                    +{value.length - visibleCount}
                  </span>
                )}
              </span>
            </>
          )}
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
          placeholder="Search or add..."
          className="mb-1 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div ref={scrollRef} className="max-h-56 overflow-y-auto pr-1">
          {value.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={clearAll}
              className={`flex h-[34px] w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-[14px] text-white/50 transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(clearAllIdx)}`}
            >
              — Clear all
            </button>
          )}
          {filtered.map((skill, i) => (
            <div
              key={skill.id}
              className={`group flex items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(skillsStart + i)}`}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => toggle(skill.id)}
                aria-pressed={selectedIds.has(skill.id)}
                className="flex flex-1 cursor-pointer items-center px-2 py-1.5 text-left"
              >
                <Badge bg={SKILL_BG}>{skill.name}</Badge>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSkillOption(skill.id)
                }}
                aria-label={`Delete ${skill.name}`}
                tabIndex={-1}
                className="mr-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.05)] hover:text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {search.trim() && !exactMatch && (
          <button
            ref={addRef}
            type="button"
            tabIndex={-1}
            onClick={handleCreate}
            disabled={createSkill.isPending}
            className={`flex h-[34px] w-full cursor-pointer items-center gap-1.5 rounded px-2 text-left text-[14px] text-white/50 transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50 ${addIdx >= 0 ? itemClass(addIdx) : ''}`}
          >
            <Plus size={12} />
            Add &ldquo;{search.trim()}&rdquo;
          </button>
        )}

        {filtered.length === 0 && !search.trim() && (
          <p className="px-2 py-1 text-[14px] text-white/30">No skills yet.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
