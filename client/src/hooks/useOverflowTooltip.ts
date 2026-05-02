import { useState } from 'react'

export function useOverflowTooltip() {
  const [isOverflowing, setIsOverflowing] = useState(false)

  function check(el: HTMLElement | null) {
    setIsOverflowing(!!el && el.scrollWidth > el.offsetWidth)
  }

  function reset() {
    setIsOverflowing(false)
  }

  return { isOverflowing, check, reset }
}
