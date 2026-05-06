import { Trash2 } from 'lucide-react'

interface PopoverListRowProps {
  className?: string
  onDelete?: () => void
  deleteLabel?: string
  deleteDisabled?: boolean
  children: React.ReactNode
}

export function PopoverListRow({
  className = '',
  onDelete,
  deleteLabel,
  deleteDisabled,
  children,
}: PopoverListRowProps) {
  return (
    <div
      className={`group flex items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.06)] ${className}`}
    >
      {children}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={deleteLabel}
          tabIndex={-1}
          disabled={deleteDisabled}
          className="mr-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded text-white/50 transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-destructive disabled:opacity-30"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
