import { useState, useMemo, useRef } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyCell } from './EmptyCell'
import { CellTrigger } from './CellTrigger'
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
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { useOverflowCount } from '@/hooks/useOverflowCount'
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

export function SkillsCell({ value, onSave }: SkillsCellProps) {
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const { data: allSkills = [] } = useSkills()
  const createSkill = useCreateSkill()
  const deleteSkill = useDeleteSkill()

  const { visibleRef, measurerRef, visibleCount } = useOverflowCount(value)

  const selectedIds = useMemo(
    () => new Set(value.map((s) => s.skill.id)),
    [value],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSkills.filter((s) => {
      if (selectedIds.has(s.id)) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
    })
  }, [allSkills, search, selectedIds])

  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSkills.some((s) => s.name.toLowerCase() === q)
  }, [allSkills, search])

  const addIdx = search.trim() && !exactMatch ? filtered.length : -1
  const totalItems = filtered.length + (addIdx >= 0 ? 1 : 0)

  const { open, setHighlighted, handleOpenChange, handleKeyDown, itemClass } =
    useKeyboardNav({
      totalItems,
      listRef,
      onEnter: (i) => {
        if (i >= 0 && i < filtered.length) toggle(filtered[i].id)
        else if (i === addIdx) handleCreate()
      },
      onSearchEnter: () => {
        if (!exactMatch && search.trim()) handleCreate()
      },
      resolveExtraScrollTarget: (i) => (i === addIdx ? addRef.current : null),
    })

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

  const overflowCount =
    value.length > visibleCount ? value.length - visibleCount : 0

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
            <CellTrigger className="overflow-hidden pr-8 pl-3">
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
                    {overflowCount > 0 && (
                      <span className="inline-flex flex-shrink-0 items-center rounded-md bg-[rgba(255,255,255,0.08)] px-[5px] py-px text-[12px] text-white/60">
                        +{overflowCount}
                      </span>
                    )}
                  </span>
                </>
              )}
            </CellTrigger>
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent
          align="start"
          className="w-52 p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {value.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1 px-1 pt-1 pb-0.5">
              {value.map(({ skill }) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 rounded-md bg-[rgba(255,255,255,0.10)] py-[1px] pr-1 pl-2 text-[14px] font-medium text-foreground"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => toggle(skill.id)}
                    aria-label={`Remove ${skill.name}`}
                    className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-white/40 transition-colors hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <input
            autoFocus
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setHighlighted(-1)
            }}
            onKeyDown={handleKeyDown}
            maxLength={15}
            placeholder="Search or add..."
            className="mb-1 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          />

          <div ref={listRef} className="max-h-56 overflow-y-auto pr-1">
            {filtered.map((skill, i) => (
              <div
                key={skill.id}
                className={`group flex items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.06)] ${itemClass(i)}`}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => toggle(skill.id)}
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
                  className="mr-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded text-white/50 transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-destructive"
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
            <p className="px-2 py-1 text-[14px] text-white/30">
              {allSkills.length === 0 ? 'No skills yet.' : 'All selected.'}
            </p>
          )}
        </PopoverContent>
      </Popover>

      {overflowCount > 0 && !open && (
        <TooltipContent side="top" className="max-w-[250px]">
          <span className="break-words">
            {value.map((s) => s.skill.name).join(', ')}
          </span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
