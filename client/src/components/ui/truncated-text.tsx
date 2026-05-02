import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import { useOverflowTooltip } from '@/hooks/useOverflowTooltip'

interface TruncatedTextProps {
  children: string
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function TruncatedText({
  children,
  className,
  side = 'left',
}: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const { isOverflowing, check, reset } = useOverflowTooltip()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          className={cn('min-w-0 truncate', className)}
          onMouseEnter={() => check(ref.current)}
          onMouseLeave={reset}
        >
          {children}
        </span>
      </TooltipTrigger>
      {isOverflowing && (
        <TooltipContent side={side} className="max-w-[250px] pr-4">
          <span className="min-w-0 break-words">{children}</span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
