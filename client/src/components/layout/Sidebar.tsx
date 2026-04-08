import { NavLink } from 'react-router'
import { LayoutGrid, AlignLeft, CalendarDays, User } from 'lucide-react'
import { cn } from '@/utils/classNames'

const navItems = [
  { to: '/quick-copy', label: 'Quick copy', icon: LayoutGrid },
  { to: '/answer-bank', label: 'Answers', icon: AlignLeft },
  { to: '/tracker', label: 'Applications', icon: CalendarDays },
]

export default function Sidebar() {
  return (
    <aside className="w-[210px] min-w-[210px] bg-card border-r border-border flex flex-col px-3 py-5 gap-0.5">
      <div className="px-2 pb-4 mb-2 border-b border-border">
        <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 42, fontWeight: 400, letterSpacing: '-1.5px', color: '#F43F5E' }}>
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
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={16} className={cn(isActive ? 'opacity-100' : 'opacity-55')} />
              {label}
            </>
          )}
        </NavLink>
      ))}

      <div className="flex-1" />

      <NavLink
        to="/account"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2 px-2 py-[7px] rounded-lg text-sm transition-colors',
            isActive
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )
        }
      >
        {({ isActive }) => (
          <>
            <User size={16} className={cn(isActive ? 'opacity-100' : 'opacity-55')} />
            Account
          </>
        )}
      </NavLink>
    </aside>
  )
}
