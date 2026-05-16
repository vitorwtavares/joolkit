import { useState, useMemo, useRef } from 'react'
import { Plus, X } from 'lucide-react'
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
  multiLine?: boolean
}

const SKILL_BG = 'var(--input-border-strong)'

export function SkillsCell({
  value,
  onSave,
  multiLine = false,
}: SkillsCellProps) {
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const { data: allSkills = [] } = useSkills()
  const createSkill = useCreateSkill()
  const deleteSkill = useDeleteSkill()

  const selectedSkillIds = useMemo(() => value.map((s) => s.skill.id), [value])

  const skillsById = useMemo(
    () => new Map(allSkills.map((skill) => [skill.id, skill])),
    [allSkills],
  )
  const selectedSkills = useMemo(
    () =>
      selectedSkillIds.map((id) => ({
        skill: skillsById.get(id) ??
          value.find((entry) => entry.skill.id === id)?.skill ?? {
            id,
            name: '…',
          },
      })),
    [selectedSkillIds, skillsById, value],
  )

  const { visibleRef, measurerRef, visibleCount } = useOverflowCount(
    selectedSkills,
    {
      maxLines: multiLine ? 2 : 1,
    },
  )

  const selectedIds = useMemo(
    () => new Set(selectedSkillIds),
    [selectedSkillIds],
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
      ? selectedSkillIds.filter((id) => id !== skillId)
      : [...selectedSkillIds, skillId]
    onSave(newIds)
  }

  function handleCreate() {
    const name = search.trim()
    if (!name) return
    createSkill.mutate(name, {
      onSuccess: (skill) => {
        onSave([...selectedSkillIds, skill.id])
        setSearch('')
        setHighlighted(-1)
      },
    })
  }

  function handleDeleteSkillOption(skillId: string) {
    deleteSkill.mutate(skillId, {
      onError: () => toast.error('Failed to delete skill'),
    })
  }

  const overflowCount =
    selectedSkills.length > visibleCount
      ? selectedSkills.length - visibleCount
      : 0

  return (
    <Tooltip open={overflowCount > 0 && !open ? undefined : false}>
      <Popover
        open={open}
        onOpenChange={(v) => {
          handleOpenChange(v)
          if (!v) setSearch('')
        }}
      >
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            {multiLine ? (
              <button
                type="button"
                className="relative w-full cursor-pointer rounded px-3 py-2 text-left text-[14px] transition-colors hover:bg-surface-hover-subtle"
              >
                <span
                  ref={measurerRef}
                  aria-hidden="true"
                  className="pointer-events-none invisible absolute top-0 left-0 flex items-center gap-[3px] whitespace-nowrap"
                >
                  {selectedSkills.map(({ skill }) => (
                    <Badge key={skill.id} bg={SKILL_BG}>
                      {skill.name}
                    </Badge>
                  ))}
                </span>
                <span ref={visibleRef} className="flex flex-wrap gap-[3px]">
                  {selectedSkills.length === 0 ? (
                    <EmptyCell />
                  ) : (
                    <>
                      {selectedSkills
                        .slice(0, visibleCount)
                        .map(({ skill }) => (
                          <Badge key={skill.id} bg={SKILL_BG}>
                            {skill.name}
                          </Badge>
                        ))}
                      {overflowCount > 0 && (
                        <span className="inline-flex flex-shrink-0 items-center rounded-md bg-border px-[5px] py-px text-[12px] text-text-dim">
                          +{overflowCount}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </button>
            ) : (
              <CellTrigger className="overflow-hidden pr-8 pl-3">
                {selectedSkills.length === 0 ? (
                  <EmptyCell />
                ) : (
                  <>
                    <span
                      ref={measurerRef}
                      aria-hidden="true"
                      className="pointer-events-none invisible absolute top-0 left-0 flex items-center gap-[3px] whitespace-nowrap"
                    >
                      {selectedSkills.map(({ skill }) => (
                        <Badge key={skill.id} bg={SKILL_BG}>
                          {skill.name}
                        </Badge>
                      ))}
                    </span>
                    <span
                      ref={visibleRef}
                      className="flex w-full min-w-0 flex-1 items-center gap-[3px] overflow-hidden"
                    >
                      {selectedSkills
                        .slice(0, visibleCount)
                        .map(({ skill }) => (
                          <Badge key={skill.id} bg={SKILL_BG}>
                            {skill.name}
                          </Badge>
                        ))}
                      {overflowCount > 0 && (
                        <span className="inline-flex flex-shrink-0 items-center rounded-md bg-border px-[5px] py-px text-[12px] text-text-dim">
                          +{overflowCount}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </CellTrigger>
            )}
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent
          align="start"
          className="w-52 p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {selectedSkills.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1 px-1 pt-1 pb-0.5">
              {selectedSkills.map(({ skill }) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 rounded-md bg-input-border-strong py-[1px] pr-1 pl-2 text-[14px] font-medium text-foreground"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => toggle(skill.id)}
                    aria-label={`Remove ${skill.name}`}
                    className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-text-muted-softer transition-colors hover:text-foreground"
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
            maxLength={25}
            placeholder="Search or add..."
            className={`mb-1 w-full ${INPUT_BASE}`}
          />

          <div ref={listRef} className="max-h-56 overflow-y-auto pr-1">
            {filtered.map((skill, i) => (
              <PopoverListRow
                key={skill.id}
                className={itemClass(i)}
                onDelete={() => handleDeleteSkillOption(skill.id)}
                deleteLabel={`Delete ${skill.name}`}
                deleteDisabled={createSkill.isPending}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => toggle(skill.id)}
                  className="flex flex-1 cursor-pointer items-center px-2 py-1.5 text-left"
                >
                  <Badge bg={SKILL_BG}>{skill.name}</Badge>
                </button>
              </PopoverListRow>
            ))}
          </div>

          {search.trim() && !exactMatch && (
            <button
              ref={addRef}
              type="button"
              tabIndex={-1}
              onClick={handleCreate}
              disabled={createSkill.isPending}
              className={`${POPOVER_ITEM_CLASS} gap-1.5 text-text-faint disabled:opacity-50 ${addIdx >= 0 ? itemClass(addIdx) : ''}`}
            >
              <Plus size={12} />
              Add &ldquo;{search.trim()}&rdquo;
            </button>
          )}

          {filtered.length === 0 && !search.trim() && (
            <p className="px-2 py-1 text-[14px] text-text-muted-soft">
              {allSkills.length === 0 ? 'No skills yet.' : 'All selected.'}
            </p>
          )}
        </PopoverContent>
      </Popover>

      {overflowCount > 0 && !open && (
        <TooltipContent side="top" className="max-w-[250px]">
          <span className="break-words">
            {selectedSkills.map((s) => s.skill.name).join(', ')}
          </span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
