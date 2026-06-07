import { cn } from '@/lib/utils'
import { normalizeTokenKey } from './tokenUtils'

type TokenPillVariant = 'resolved' | 'unresolved-tooltip'

interface TokenPillProps {
  tokenKey: string
  variant?: TokenPillVariant
  className?: string
}

export function TokenPill({
  tokenKey,
  variant = 'resolved',
  className,
}: TokenPillProps) {
  const key = normalizeTokenKey(tokenKey)

  return (
    <span
      className={cn(
        'm-0 inline-flex cursor-default items-center rounded-[5px] pt-[3px] pr-[3px] pb-[2px] pl-[3px] align-middle font-mono text-[12.35px] leading-none font-medium',
        variant === 'resolved' && 'token-resolved',
        variant === 'unresolved-tooltip' &&
          'border border-token-unresolved-border/55 bg-black/30 text-token-unresolved shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <span>{'{{'}</span>
      <span className="inline-block px-[3px]">{key || 'token'}</span>
      <span>{'}}'}</span>
    </span>
  )
}
