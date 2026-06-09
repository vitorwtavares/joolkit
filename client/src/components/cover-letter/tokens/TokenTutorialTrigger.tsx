import { useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TokenTutorialDialog } from './TokenTutorialDialog'

interface TokenTutorialTriggerProps {
  variant?: 'quick-copy' | 'editor'
  className?: string
}

export function TokenTutorialTrigger({
  variant = 'quick-copy',
  className,
}: TokenTutorialTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex cursor-pointer items-center rounded-md transition-colors',
          variant === 'editor'
            ? 'gap-1.5 px-1.5 py-0.5 text-[13px] text-brand hover:bg-brand-soft hover:text-brand'
            : 'px-1.5 py-0.5 text-[13px] text-text-faint hover:bg-secondary hover:text-foreground',
          className,
        )}
      >
        {variant === 'editor' && <Info className="size-[13px] shrink-0" />}
        How to use tokens
      </button>
      <TokenTutorialDialog
        open={open}
        onOpenChange={setOpen}
        variant={variant}
      />
    </>
  )
}
