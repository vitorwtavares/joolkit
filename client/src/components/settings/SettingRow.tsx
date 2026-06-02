import type { ReactNode } from 'react'

interface SettingRowProps {
  title: string
  description: string
  children: ReactNode
}

export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
