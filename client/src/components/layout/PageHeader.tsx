interface PageHeaderProps {
  title: string
  subtitle: React.ReactNode
  right?: React.ReactNode
  subtitleClassName?: string
}

export function PageHeader({
  title,
  subtitle,
  right,
  subtitleClassName = 'mb-8',
}: PageHeaderProps) {
  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[36px] leading-tight font-medium tracking-tight">
          {title}
        </h1>
        {right}
      </div>
      <p className={`text-[15px] text-muted-foreground ${subtitleClassName}`}>
        {subtitle}
      </p>
    </>
  )
}
