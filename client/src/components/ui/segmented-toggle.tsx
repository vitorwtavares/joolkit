import { cn } from '@/lib/utils'

type SegmentedOption<T extends string> = {
  label: string
  value: T
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  variant?: 'default' | 'compact'
  disabled?: boolean
  fullWidth?: boolean
  className?: string
  buttonClassName?: string
}

// Equal-width segments via CSS grid (`auto-cols-[1fr]`) sized to the widest
// label — no JS measurement, which is what previously broke inside animated
// popovers. The highlight is one column wide and slides between segments with a
// transform, so the active position animates smoothly.
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
  disabled = false,
  fullWidth = false,
  className = '',
  buttonClassName = '',
}: SegmentedToggleProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value)

  const buttonBaseClassName = cn(
    'relative z-10 rounded-md py-1 text-center text-[12.5px] whitespace-nowrap transition-colors outline-none focus-visible:outline-none',
    variant === 'compact' ? 'px-2' : 'px-3.5',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
  )

  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-secondary p-[3px]',
        fullWidth ? 'flex w-full' : 'inline-flex',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div
        className={cn(
          'relative grid auto-cols-[1fr] grid-flow-col',
          fullWidth && 'w-full',
        )}
      >
        {activeIndex >= 0 && !disabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-surface-selected shadow-[0_1px_0_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out"
            style={{
              width: `${100 / options.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {/* With no slider to divide them, the disabled state renders faint
            separators at each segment boundary so it doesn't read as one
            blank pill. */}
        {disabled &&
          options
            .slice(1)
            .map((option, i) => (
              <div
                key={option.value}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1.5 w-px bg-foreground/15"
                style={{ left: `${((i + 1) * 100) / options.length}%` }}
              />
            ))}
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                buttonBaseClassName,
                isActive && !disabled
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
                !disabled && !isActive && 'hover:text-foreground',
                buttonClassName,
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
