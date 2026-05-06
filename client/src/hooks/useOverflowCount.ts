import { useLayoutEffect, useRef, useState } from 'react'

// Reserved px width for the "+N" overflow badge — keeps space for it when calculating how many items fit
const COUNTER_W = 30
const GAP = 3

interface Options {
  maxLines?: number
}

export function useOverflowCount<T>(items: T[], options: Options = {}) {
  const { maxLines = 1 } = options
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

      if (maxLines === 1) {
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
      } else {
        let lineWidth = 0
        let linesUsed = 0
        let count = 0
        for (let i = 0; i < children.length; i++) {
          const w = children[i].offsetWidth
          const wWithGap = lineWidth > 0 ? w + GAP : w
          const remaining = children.length - 1 - i
          const onLastLine = linesUsed === maxLines - 1
          const reserve = onLastLine && remaining > 0 ? COUNTER_W + GAP : 0
          if (lineWidth + wWithGap + reserve > containerWidth) {
            if (linesUsed < maxLines - 1) {
              linesUsed++
              const nowOnLastLine = linesUsed === maxLines - 1
              let reserveNow = 0
              if (nowOnLastLine && remaining > 0) {
                // Look ahead: only reserve +N space if the remaining items don't all fit
                let testW = 0
                let allFit = true
                for (let j = i; j < children.length; j++) {
                  testW += (j > i ? GAP : 0) + children[j].offsetWidth
                  if (testW > containerWidth) {
                    allFit = false
                    break
                  }
                }
                if (!allFit) reserveNow = COUNTER_W + GAP
              }
              if (w + reserveNow <= containerWidth) {
                lineWidth = w
                count++
              } else {
                break
              }
            } else {
              break
            }
          } else {
            lineWidth += wWithGap
            count++
          }
        }
        setVisibleCount(count)
      }
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(visible)
    return () => ro.disconnect()
  }, [items, maxLines])

  return { visibleRef, measurerRef, visibleCount }
}
