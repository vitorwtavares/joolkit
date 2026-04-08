import { NavLink } from 'react-router'
import { toast } from 'sonner'
import { LayoutGrid, AlignLeft, CalendarDays, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/getInitials'
import { useAuth } from '@/context/auth'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
    <aside className="flex w-[210px] min-w-[210px] flex-col gap-0.5 border-r border-border bg-card px-3 py-5">
      <div className="mb-2 border-b border-border px-2 pb-4">
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
              'flex items-center gap-2 rounded-lg px-2 py-[7px] text-sm transition-colors',
              isActive
                ? 'bg-secondary font-medium text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
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
              'flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-sm transition-colors',
              'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              'data-[state=open]:bg-secondary data-[state=open]:text-foreground',
            )}
          >
            <Avatar
              className="size-[30px] after:hidden"
              style={{
                background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
              }}
            >
              <AvatarFallback
                className="bg-transparent text-[14px] font-semibold"
                style={{ color: 'var(--brand)' }}
              >
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
          className="w-[186px] gap-0 overflow-hidden rounded-xl p-0"
        >
          <div className="px-3 py-3">
            <span className="block truncate text-xs leading-tight text-muted-foreground">
              {email}
            </span>
          </div>

          <Separator />

          <button
            onClick={() =>
              signOut().catch(() =>
                toast.error('Failed to sign out. Please try again.'),
              )
            }
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <LogOut size={14} className="opacity-70" />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </aside>
  )
}
