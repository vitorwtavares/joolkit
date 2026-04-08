import { NavLink } from 'react-router'
import { LayoutGrid, AlignLeft, CalendarDays, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/getInitials'
import { useAuth } from '@/context/auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/quick-copy', label: 'Quick copy', icon: LayoutGrid },
  { to: '/answer-bank', label: 'Answers', icon: AlignLeft },
  { to: '/tracker', label: 'Applications', icon: CalendarDays },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  const email = user?.email ?? ''
  const initial = email ? getInitials(email) : '?'

  return (
    <aside className="w-[210px] min-w-[210px] bg-card border-r border-border flex flex-col px-3 py-5 gap-0.5">
      <div className="px-2 pb-4 mb-2 border-b border-border">
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 42,
            fontWeight: 400,
            letterSpacing: '-1.5px',
            color: 'var(--brand)',
          }}
        >
          noloop
        </span>
      </div>

      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-2 py-[7px] rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-secondary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={16}
                className={cn(isActive ? 'opacity-100' : 'opacity-55')}
              />
              {label}
            </>
          )}
        </NavLink>
      ))}

      <div className="flex-1" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-sm transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              'data-[state=open]:bg-secondary data-[state=open]:text-foreground',
            )}
          >
            <Avatar className="size-[30px] after:hidden" style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)' }}>
              <AvatarFallback className="bg-transparent text-[14px] font-semibold" style={{ color: 'var(--brand)' }}>
                {initial}
              </AvatarFallback>
            </Avatar>
            Account
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[186px] p-0 gap-0 rounded-xl overflow-hidden"
        >
          <div className="px-3 py-3">
            <span className="text-xs text-muted-foreground truncate leading-tight block">
              {email}
            </span>
          </div>

          <Separator />

          <button
            onClick={() => void signOut()}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <LogOut size={14} className="opacity-70" />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </aside>
  )
}
