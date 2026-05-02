import { useEffect, useRef, useState, type RefObject } from 'react'

interface UseKeyboardNavOptions {
  totalItems: number
  listRef: RefObject<HTMLElement | null>
  onEnter: (highlighted: number) => void
  onSearchEnter?: () => void
  resolveExtraScrollTarget?: (highlighted: number) => HTMLElement | null
}

export function useKeyboardNav({
  totalItems,
  listRef,
  onEnter,
  onSearchEnter,
  resolveExtraScrollTarget,
}: UseKeyboardNavOptions) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const highlightedRef = useRef(highlighted)
  useEffect(() => {
    highlightedRef.current = highlighted
  })
  const optsRef = useRef({
    totalItems,
    onEnter,
    onSearchEnter,
    resolveExtraScrollTarget,
    listRef,
  })

  useEffect(() => {
    optsRef.current = {
      totalItems,
      onEnter,
      onSearchEnter,
      resolveExtraScrollTarget,
      listRef,
    }
  })

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setHighlighted(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const { totalItems, onEnter, onSearchEnter } = optsRef.current
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (highlightedRef.current >= 0) {
        e.preventDefault()
        onEnter(highlightedRef.current)
      } else if (onSearchEnter) {
        onSearchEnter()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (highlighted < 0) return
    const { listRef, resolveExtraScrollTarget } = optsRef.current
    const extra = resolveExtraScrollTarget?.(highlighted)
    const target =
      extra ??
      (listRef.current?.children[highlighted] as HTMLElement | undefined)
    target?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  function itemClass(idx: number) {
    return highlighted === idx ? 'bg-[rgba(255,255,255,0.06)]' : ''
  }

  function focusListOnOpen(e: Event) {
    e.preventDefault()
    optsRef.current.listRef.current?.focus()
  }

  return {
    open,
    setOpen,
    highlighted,
    setHighlighted,
    handleOpenChange,
    handleKeyDown,
    itemClass,
    focusListOnOpen,
  }
}
