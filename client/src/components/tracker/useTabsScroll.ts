import { useCallback, useEffect, useRef, useState } from 'react'

export function useTabsScroll() {
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [tabsOverflowLeft, setTabsOverflowLeft] = useState(false)
  const [tabsOverflowRight, setTabsOverflowRight] = useState(false)

  const scrollTabsToStart = useCallback(() => {
    tabsScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [])

  const scrollTabsToEnd = useCallback(() => {
    const el = tabsScrollRef.current
    if (!el) return
    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = tabsScrollRef.current
    if (!el) return
    const check = () => {
      setTabsOverflowLeft(el.scrollLeft > 1)
      setTabsOverflowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    const horizontalWheelDelta = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE)
        return event.deltaY * 16
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE)
        return event.deltaY * el.clientWidth
      return event.deltaY
    }
    const scrollVerticalWheelHorizontally = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      event.stopPropagation()
      el.scrollLeft -= horizontalWheelDelta(event)
      check()
    }

    const resize = new ResizeObserver(check)
    resize.observe(el)
    for (const child of Array.from(el.children)) resize.observe(child)

    // Track when tabs are added/removed (dynamic views in P7) and start
    // observing their size too. ResizeObserver fires on existing children's
    // size changes; MutationObserver picks up new children's existence.
    const mutation = new MutationObserver((entries) => {
      for (const e of entries) {
        for (const node of e.addedNodes) {
          if (node instanceof Element) resize.observe(node)
        }
      }
      check()
    })
    mutation.observe(el, { childList: true })

    el.addEventListener('scroll', check)
    el.addEventListener('wheel', scrollVerticalWheelHorizontally, {
      passive: false,
    })
    return () => {
      el.removeEventListener('scroll', check)
      el.removeEventListener('wheel', scrollVerticalWheelHorizontally)
      resize.disconnect()
      mutation.disconnect()
    }
  }, [])

  return {
    tabsScrollRef,
    tabsOverflowLeft,
    tabsOverflowRight,
    scrollTabsToStart,
    scrollTabsToEnd,
  }
}
