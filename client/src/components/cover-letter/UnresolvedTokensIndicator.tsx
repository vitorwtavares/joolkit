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

const indicatorRowClass =
  'flex h-[18px] min-w-0 items-center gap-1.5 text-[12px] leading-none'

function TokenStatusDot({ resolved }: { resolved: boolean }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-visible p-[3px]">
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          resolved
            ? 'bg-success shadow-[0_0_0_3px_rgba(95,191,129,0.16)]'
            : 'bg-danger shadow-[0_0_0_3px_var(--danger-soft-fill)]',
        )}
      />
    </span>
  )
}

export function UnresolvedTokensIndicator({
  unresolvedTokens,
  isLoading = false,
  className,
}: UnresolvedTokensIndicatorProps) {
  const hasUnresolved = unresolvedTokens.length > 0

  if (isLoading) {
    return (
      <div className={cn(indicatorRowClass, 'text-text-faint', className)}>
        <span className="truncate">Loading</span>
      </div>
    )
  }

  if (!hasUnresolved) {
    return (
      <div className={cn(indicatorRowClass, 'text-text-faint', className)}>
        <TokenStatusDot resolved />
        <span className="truncate">All resolved</span>
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            indicatorRowClass,
            'cursor-help rounded-sm border-0 bg-transparent p-0 text-token-unresolved transition-colors outline-none hover:text-token-unresolved/90 focus-visible:ring-2 focus-visible:ring-token-unresolved-border/60',
            className,
          )}
        >
          <TokenStatusDot resolved={false} />
          <span className="truncate">{unresolvedTokens.length} unresolved</span>
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
