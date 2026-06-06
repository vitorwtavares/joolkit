import { X } from 'lucide-react'

interface TagProps {
  children: React.ReactNode
  onRemove?: () => void
}

export function Tag({ children, onRemove }: TagProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-brand-soft px-2 py-0.5 text-[13px] font-medium whitespace-nowrap text-brand">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove tag"
          className="-mr-0.5 flex cursor-pointer items-center text-brand/50 transition-colors hover:text-danger"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}
