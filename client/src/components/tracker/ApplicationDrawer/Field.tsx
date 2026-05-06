export function Field({
  label,
  children,
  autoHeight = false,
  className = '',
}: {
  label: string
  children: React.ReactNode
  autoHeight?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-0.5 pl-3 text-[12px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <div className={autoHeight ? 'relative' : 'relative h-10'}>
        {children}
      </div>
    </div>
  )
}
