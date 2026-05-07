import { SegmentedToggle } from '@/components/ui/segmented-toggle'

type Variation = 'formal' | 'light'

interface VariationToggleProps {
  variation: Variation
  onChange: (v: Variation) => void
}

export function VariationToggle({ variation, onChange }: VariationToggleProps) {
  return (
    <SegmentedToggle
      value={variation}
      onChange={onChange}
      options={[
        { label: 'Formal', value: 'formal' },
        { label: 'Light', value: 'light' },
      ]}
    />
  )
}
