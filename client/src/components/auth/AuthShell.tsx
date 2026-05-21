import type { ReactNode } from 'react'
import noloopStackedLogo from '@/assets/logo/noloop-stacked-light-1024.png'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen justify-center overflow-auto bg-background">
      <div className="flex w-[min(420px,calc(100%_-_48px))] flex-col gap-12 pt-10 pb-16">
        <img src={noloopStackedLogo} alt="noloop" className="mx-auto h-40" />
        {children}
      </div>
    </div>
  )
}
