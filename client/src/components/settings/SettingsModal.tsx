import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { AccountSettings } from './AccountSettings'

type SectionId = 'account'

const sections = [{ id: 'account', label: 'Account', icon: UserRound }] as const

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [active, setActive] = useState<SectionId>('account')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[min(620px,86vh)] w-[min(900px,92vw)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <nav className="flex w-[200px] shrink-0 flex-col gap-0.5 border-r border-border bg-muted/40 p-3">
          <DialogTitle className="px-2 pt-1 pb-3 text-base font-semibold tracking-tight">
            Settings
          </DialogTitle>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-current={active === id ? 'true' : undefined}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors outline-none',
                active === id
                  ? 'bg-sidebar-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground focus-visible:bg-sidebar-hover focus-visible:text-foreground',
              )}
            >
              <Icon size={16} className="shrink-0 opacity-80" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {active === 'account' && <AccountSettings />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
