import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface TruncatedLabelProps {
  text: string
  className?: string
}

export function TruncatedLabel({ text, className }: TruncatedLabelProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setIsTruncated(el.scrollWidth > el.offsetWidth)
  }, [text])

  const span = (
    <span ref={ref} className={cn('w-full truncate text-center', className)}>
      {text}
    </span>
  )

  if (!isTruncated) return span

  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent className="max-w-[200px] break-all whitespace-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
