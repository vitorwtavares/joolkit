import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TokenPill } from './TokenPill'

interface UnresolvedTokensIndicatorProps {
  unresolvedTokens: string[]
  isLoading?: boolean
  className?: string
}

export function UnresolvedTokensIndicator({
  unresolvedTokens,
  isLoading = false,
  className,
}: UnresolvedTokensIndicatorProps) {
  const hasUnresolved = unresolvedTokens.length > 0

  if (isLoading) {
    return (
      <div className={cn('truncate text-[11px] text-text-faint', className)}>
        Loading
      </div>
    )
  }

  if (!hasUnresolved) {
    return (
      <div className={cn('truncate text-[11px] text-text-faint', className)}>
        All resolved
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'cursor-help truncate rounded-sm text-[12px] text-token-unresolved transition-colors outline-none hover:text-token-unresolved/90 focus-visible:ring-2 focus-visible:ring-token-unresolved-border/60',
            className,
          )}
        >
          {unresolvedTokens.length} unresolved
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="end"
        sideOffset={8}
        hideArrow
        className="w-[342px] max-w-none flex-col items-start gap-2 rounded-lg border border-token-unresolved-border bg-[#2f1f20] px-3.5 py-3 text-left whitespace-normal text-token-unresolved shadow-lg [&_svg]:bg-[#2f1f20] [&_svg]:fill-[#2f1f20]"
      >
        <div className="flex items-center gap-1.5 text-xs leading-none text-token-unresolved">
          <Info className="size-3 shrink-0 text-token-unresolved" />
          <strong className="font-medium">Missing token key or values</strong>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unresolvedTokens.map((token) => (
            <TokenPill
              key={token}
              tokenKey={token}
              variant="unresolved-tooltip"
            />
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
