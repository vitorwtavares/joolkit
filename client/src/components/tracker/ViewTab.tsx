import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TrackerView } from '@/api/hooks/useTrackerViews'

interface ViewTabProps {
  view: TrackerView
  isActive: boolean
  count: number
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
}

// A single view tab: the select button plus, for non-permanent views, an
// options menu (rename / delete). The kebab stays hidden until the tab is
// active, hovered, focused, or its menu is open so the strip stays clean.
export function ViewTab({
  view,
  isActive,
  count,
  onSelect,
  onRename,
  onDelete,
}: ViewTabProps) {
  const hasMenu = !view.is_permanent
  return (
    <div
      role="presentation"
      className={cn(
        'group/tab relative mb-[-0.5px] flex flex-shrink-0 items-center border-b-2 transition-colors',
        isActive ? 'border-brand' : 'border-transparent',
      )}
    >
      <button
        role="tab"
        aria-selected={isActive}
        onClick={onSelect}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 py-2 ps-3.5 text-[14px] font-medium whitespace-nowrap transition-colors',
          hasMenu ? 'pe-1.5' : 'pe-3.5',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {view.name}
        <span
          className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-[6px] px-1.5 py-px font-mono text-[12px] leading-[1] font-medium',
            isActive
              ? 'bg-brand text-brand-foreground'
              : 'bg-input-subtle text-text-faint',
          )}
        >
          {count}
        </span>
      </button>
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${view.name} view options`}
              className={cn(
                'me-1.5 flex size-5 flex-shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-[color,background-color,opacity] group-hover/tab:opacity-100 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 data-[state=open]:bg-secondary data-[state=open]:text-foreground data-[state=open]:opacity-100',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            >
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuItem onSelect={onRename}>
              <Pencil size={14} />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
