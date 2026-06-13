import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradeCTAProps {
  label: string
  onClick: () => void
  className?: string
}

// The shared dashed, brand-soft "upgrade to lift this cap" affordance used in
// the footer of capped lists (resume/cover-letter variations, tokens).
export function UpgradeCTA({ label, onClick, className }: UpgradeCTAProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand-border bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-brand transition-colors hover:bg-brand-soft/70',
        className,
      )}
    >
      <Sparkles size={14} />
      {label}
    </button>
  )
}
