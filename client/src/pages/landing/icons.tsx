// Bespoke product/brand glyphs ported verbatim from the design handoff.
// These are tuned to match the real app's iconography (e.g. the table glyph
// mirrors the actual Applications view) — intentionally not Lucide swaps.

interface IconProps {
  size?: number
  color?: string
}

export function CopyIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect
        x="7"
        y="4"
        width="9"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="10"
        y="8"
        width="9"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export function LetterIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 9h8M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BankIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path
        d="M5 7a2 2 0 0 1 2-2h6l5 5v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M13 5v4h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 14l2 2 4-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Table icon — matches the real Applications view, never a board/kanban glyph.
export function TableIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 9.5h16M10 9.5V19" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 14.25h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function CheckIcon({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size}>
      <path
        d="M4 10.5l3.5 3.5L16 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
