import { cn } from '@/lib/utils'

interface CompanyAvatarProps {
  name: string | null
  className?: string
}

// Hue derived purely from the first letter — A maps to red, walking around the
// hue circle through Z. Every company starting with "S" is the same blue;
// editing a name only changes the color when the first letter changes.
function hueFor(name: string): number {
  const code = name.trim().charAt(0).toUpperCase().charCodeAt(0)
  if (code >= 65 && code <= 90) return ((code - 65) / 26) * 360
  return 220
}

export function CompanyAvatar({ name, className }: CompanyAvatarProps) {
  const trimmed = name?.trim() ?? ''
  const letter = trimmed.charAt(0).toUpperCase() || '?'
  const hue = trimmed ? hueFor(trimmed) : 0
  const filled = !!trimmed

  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid size-[24px] flex-shrink-0 place-items-center rounded-md text-[12px] font-semibold',
        className,
      )}
      style={
        filled
          ? {
              background: `oklch(32% 0.05 ${hue})`,
              color: `oklch(85% 0.1 ${hue})`,
            }
          : {
              background: 'var(--secondary)',
              color: 'var(--text-faint)',
            }
      }
    >
      {letter}
    </span>
  )
}
