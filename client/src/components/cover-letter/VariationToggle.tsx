type Variation = 'formal' | 'light'

interface VariationToggleProps {
  variation: Variation
  onChange: (v: Variation) => void
}

export function VariationToggle({ variation, onChange }: VariationToggleProps) {
  const formalActive = variation === 'formal'

  return (
    <div className="flex gap-0.5 rounded-full border border-border bg-secondary p-[3px]">
      <button
        onClick={() => onChange('formal')}
        className={`cursor-pointer rounded-full px-3.5 py-1 text-xs transition-colors ${
          formalActive
            ? 'bg-surface-selected font-medium text-foreground'
            : 'text-muted-foreground'
        }`}
      >
        Formal
      </button>
      <button
        onClick={() => onChange('light')}
        className={`cursor-pointer rounded-full px-3.5 py-1 text-xs transition-colors ${
          !formalActive
            ? 'bg-surface-selected font-medium text-foreground'
            : 'text-muted-foreground'
        }`}
      >
        Light
      </button>
    </div>
  )
}
