import { Plus } from 'lucide-react'

interface EmptySlotCardProps {
  onAdd: () => void
}

export function EmptySlotCard({ onAdd }: EmptySlotCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group/empty grid min-h-[196px] cursor-pointer place-items-center rounded-[10px] border border-dashed border-border-subtle bg-transparent p-4 text-center transition-colors hover:border-border hover:bg-secondary/40"
    >
      <div className="flex flex-col items-center gap-2.5 text-text-faint">
        <div className="grid size-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover/empty:text-foreground">
          <Plus size={16} />
        </div>
        <div>
          <div className="text-[13px] font-medium text-muted-foreground">
            Add an answer
          </div>
          <div className="mt-0.5 text-[11.5px] text-text-faint">
            Question + Default + Detailed
          </div>
        </div>
      </div>
    </button>
  )
}
