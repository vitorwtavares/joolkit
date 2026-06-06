import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

interface PersistentScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  contentClassName?: string
}

const MIN_THUMB_HEIGHT = 32

export function PersistentScrollArea({
  children,
  className,
  viewportClassName,
  contentClassName,
}: PersistentScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{
    startY: number
    startScrollTop: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [thumb, setThumb] = useState({
    visible: false,
    top: 0,
    height: MIN_THUMB_HEIGHT,
  })

  const updateThumb = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const { clientHeight, scrollHeight, scrollTop } = viewport
    const visible = scrollHeight > clientHeight + 1
    if (!visible) {
      setThumb((current) =>
        current.visible
          ? { visible: false, top: 0, height: MIN_THUMB_HEIGHT }
          : current,
      )
      return
    }

    const height = Math.max(
      MIN_THUMB_HEIGHT,
      (clientHeight / scrollHeight) * clientHeight,
    )
    const maxTop = clientHeight - height
    const top =
      scrollHeight === clientHeight
        ? 0
        : (scrollTop / (scrollHeight - clientHeight)) * maxTop

    setThumb({ visible, top, height })
  }, [])

  useLayoutEffect(() => {
    updateThumb()
  }, [children, updateThumb])

  useEffect(() => {
    updateThumb()

    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const resizeObserver = new ResizeObserver(updateThumb)
    resizeObserver.observe(viewport)
    resizeObserver.observe(content)

    const mutationObserver = new MutationObserver(updateThumb)
    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    window.addEventListener('resize', updateThumb)
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', updateThumb)
    }
  }, [updateThumb])

  useEffect(() => {
    if (!dragging) return

    function handleMove(event: PointerEvent) {
      const viewport = viewportRef.current
      const dragState = dragStateRef.current
      if (!viewport || !dragState) return

      const { clientHeight, scrollHeight } = viewport
      const thumbHeight = Math.max(
        MIN_THUMB_HEIGHT,
        (clientHeight / scrollHeight) * clientHeight,
      )
      const maxTop = clientHeight - thumbHeight
      if (maxTop <= 0) return

      const deltaY = event.clientY - dragState.startY
      const scrollableDistance = scrollHeight - clientHeight
      viewport.scrollTop =
        dragState.startScrollTop + (deltaY / maxTop) * scrollableDistance
    }

    function endDrag() {
      dragStateRef.current = null
      setDragging(false)
    }

    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [dragging])

  function beginDrag(startY: number, startScrollTop: number) {
    dragStateRef.current = { startY, startScrollTop }
    setDragging(true)
  }

  function handleThumbPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current
    if (!viewport) return
    event.preventDefault()
    event.stopPropagation()
    beginDrag(event.clientY, viewport.scrollTop)
  }

  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current
    if (!viewport) return
    event.preventDefault()

    const { clientHeight, scrollHeight } = viewport
    const thumbHeight = Math.max(
      MIN_THUMB_HEIGHT,
      (clientHeight / scrollHeight) * clientHeight,
    )
    const maxTop = clientHeight - thumbHeight
    if (maxTop <= 0) return

    const trackRect = event.currentTarget.getBoundingClientRect()
    const targetTop = Math.min(
      Math.max(event.clientY - trackRect.top - thumbHeight / 2, 0),
      maxTop,
    )
    const scrollableDistance = scrollHeight - clientHeight
    const nextScrollTop = (targetTop / maxTop) * scrollableDistance

    viewport.scrollTop = nextScrollTop
    beginDrag(event.clientY, nextScrollTop)
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={viewportRef}
        onScroll={updateThumb}
        className={cn(
          'persistent-scroll-area-viewport min-h-0 overflow-y-auto',
          viewportClassName,
        )}
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>
      {thumb.visible && (
        <div
          onPointerDown={handleTrackPointerDown}
          className="absolute top-0 right-0 bottom-0 w-2.5 cursor-pointer"
        >
          <div
            onPointerDown={handleThumbPointerDown}
            className={cn(
              'absolute right-0 w-1 rounded-full bg-scrollbar-thumb transition-colors hover:bg-scrollbar-thumb-hover',
              dragging && 'bg-scrollbar-thumb-hover',
            )}
            style={{
              height: thumb.height,
              transform: `translateY(${thumb.top}px)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
