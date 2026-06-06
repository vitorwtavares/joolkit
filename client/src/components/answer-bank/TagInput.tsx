import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Plus, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tag } from './Tag'

export const MAX_TAGS = 8
const MAX_TAG_LENGTH = 24
const MIN_INPUT_WIDTH = 60

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export function TagInput({ tags, onChange, className }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  const [inputWidth, setInputWidth] = useState(0)

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 0,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }, [])

  useLayoutEffect(() => {
    if (mirrorRef.current) setInputWidth(mirrorRef.current.offsetWidth)
  }, [draft])

  // Keep the caret/affordance in view, and refresh the fade edges whenever the
  // content width changes.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el && (draft || editing)) el.scrollLeft = el.scrollWidth
    updateEdges()
  }, [inputWidth, draft, editing, tags, updateEdges])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH)
    setDraft('')
    if (!tag || tags.length >= MAX_TAGS) return
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    onChange([...tags, tag])
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Escape') {
      setDraft('')
      setEditing(false)
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  function handleBlur() {
    addTag(draft)
    setEditing(false)
  }

  const atLimit = tags.length >= MAX_TAGS
  const leftStop = edges.left ? '10px' : '0'
  const rightStop = edges.right ? 'calc(100% - 10px)' : '100%'
  const maskImage = `linear-gradient(to right, transparent, black ${leftStop}, black ${rightStop}, transparent)`

  return (
    <div className={cn('flex h-[26px] items-center gap-1.5', className)}>
      <TagIcon size={13} className="shrink-0 text-text-faint" />
      <div
        ref={scrollRef}
        onScroll={updateEdges}
        style={{ maskImage, WebkitMaskImage: maskImage }}
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tags.map((tag, i) => (
          <Tag key={tag} onRemove={() => removeTag(i)}>
            {tag}
          </Tag>
        ))}
        {!atLimit &&
          (editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Tag…"
              aria-label="Add a tag"
              style={{ minWidth: Math.max(inputWidth + 2, MIN_INPUT_WIDTH) }}
              className="shrink-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-dashed border-border-strong px-2 py-0.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:border-brand-border hover:text-brand"
            >
              <Plus size={12} />
              Tag
            </button>
          ))}
      </div>
      <span
        ref={mirrorRef}
        aria-hidden
        className="invisible fixed -top-full left-0 text-[13px] whitespace-pre"
      >
        {draft}
      </span>
    </div>
  )
}
