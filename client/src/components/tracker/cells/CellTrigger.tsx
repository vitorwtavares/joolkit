import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/utils'

interface CellTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>
}

export function CellTrigger({ className, ref, ...props }: CellTriggerProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'absolute inset-0 flex cursor-pointer items-center px-3 text-left text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.04)]',
        className,
      )}
      {...props}
    />
  )
}
