import { useLayoutEffect, useRef, useState } from 'react'
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
  className?: string
  buttonClassName?: string
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
  className = '',
  buttonClassName = '',
}: SegmentedToggleProps<T>) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [itemWidth, setItemWidth] = useState<number | null>(null)
  const [highlightStyle, setHighlightStyle] = useState({
    left: 0,
    width: 0,
  })

  useLayoutEffect(() => {
    const updateWidths = () => {
      const widths = options
        .map((option) => buttonRefs.current[option.value]?.offsetWidth ?? 0)
        .filter(Boolean)

      if (!widths.length) return

      setItemWidth(Math.max(...widths))
    }

    updateWidths()
    window.addEventListener('resize', updateWidths)

    return () => window.removeEventListener('resize', updateWidths)
  }, [options, variant])

  useLayoutEffect(() => {
    const activeButton = buttonRefs.current[value]
    if (!activeButton) return

    setHighlightStyle({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    })
  }, [value, itemWidth, options])

  const buttonBaseClassName =
    variant === 'compact'
      ? 'relative z-10 cursor-pointer rounded-full px-2 py-1 text-center text-xs transition-colors outline-none focus-visible:outline-none'
      : 'relative z-10 cursor-pointer rounded-full px-3.5 py-1 text-center text-xs transition-colors outline-none focus-visible:outline-none'

  return (
    <div
      className={cn(
        'relative inline-flex rounded-full border border-border bg-secondary p-[3px]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] rounded-full bg-surface-selected-hover transition-[left,width] duration-200 ease-out"
        style={highlightStyle}
      />
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonRefs.current[option.value] = node
            }}
            onClick={() => onChange(option.value)}
            style={itemWidth ? { width: itemWidth } : undefined}
            className={cn(
              buttonBaseClassName,
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground',
              buttonClassName,
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
