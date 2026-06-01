import type { ReactNode } from 'react'
import joolkitStackedLogo from '@/assets/joolkit-logo/joolkit-stacked-light-spaced.svg'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center overflow-auto bg-background px-6 py-10">
      <img src={joolkitStackedLogo} alt="joolkit" className="h-24 shrink-0" />
      <div className="flex w-[min(420px,100%)] flex-1 flex-col justify-center py-10">
        {children}
      </div>
    </div>
  )
}
