import { useLayoutEffect, useRef, useState } from 'react'

// Reserved px width for the "+N" overflow badge — keeps space for it when calculating how many items fit
const COUNTER_W = 30
const GAP = 3

export function useOverflowCount<T>(items: T[]) {
  const visibleRef = useRef<HTMLSpanElement>(null)
  const measurerRef = useRef<HTMLSpanElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)

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
  }, [items])

  return { visibleRef, measurerRef, visibleCount }
}
