import { NavLink, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  LayoutGrid,
  AlignLeft,
  CalendarDays,
  LogOut,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/getInitials'
import { useAuth } from '@/context/auth'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import joolkitLogo from '@/assets/joolkit-logo/joolkit-wordmark-light.svg'

const navItems = [
  { to: '/quick-copy', label: 'Quick copy', icon: LayoutGrid, disabled: false },
  {
    to: '/cover-letter',
    label: 'Cover letter',
    icon: FileText,
    disabled: false,
  },
  { to: '/answer-bank', label: 'Answers', icon: AlignLeft, disabled: false },
  {
    to: '/tracker',
    label: 'Applications',
    icon: CalendarDays,
    disabled: false,
  },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const email = user?.email ?? ''
  const initial = email ? getInitials(email) : '?'

  return (
    <aside className="flex w-[224px] min-w-[224px] flex-col gap-0.5 border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
      <div className="mb-4 pl-2">
        <img
          src={joolkitLogo}
          alt="joolkit"
          onClick={() => navigate('/')}
          className="h-5 cursor-pointer"
        />
      </div>

      {navItems.map(({ to, label, icon: Icon, disabled }) => {
        if (disabled) {
          return (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'flex cursor-default items-center gap-2 rounded-lg px-2 py-[7px] text-sm',
                    'text-muted-foreground/40',
                  )}
                >
                  <Icon size={16} className="opacity-50" />
                  {label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">Coming soon</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-2 py-[7px] text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={cn(
                    isActive ? 'text-brand opacity-100' : 'opacity-80',
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        )
      })}

      <div className="flex-1" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-sm transition-colors',
              'text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
              'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            )}
          >
            <Avatar
              className="size-[30px] after:hidden"
              style={{
                background: 'color-mix(in srgb, var(--brand) 48%, transparent)',
              }}
            >
              <AvatarFallback
                className="bg-transparent text-[14px] font-semibold"
                style={{ color: 'var(--brand-foreground)' }}
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
          className="w-(--radix-popover-trigger-width) gap-0 overflow-hidden rounded-xl border-sidebar-border bg-sidebar-popover p-0"
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
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:bg-sidebar-hover focus-visible:text-sidebar-foreground focus-visible:outline-none"
          >
            <LogOut size={14} className="opacity-70" />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </aside>
  )
}
