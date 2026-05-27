import type { ReactNode } from 'react'
import joolkitStackedLogo from '@/assets/joolkit-logo/joolkit-stacked-light-spaced.svg'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen justify-center overflow-auto bg-background">
      <div className="flex w-[min(420px,calc(100%_-_48px))] flex-col gap-12 pt-10 pb-16">
        <img
          src={joolkitStackedLogo}
          alt="joolkit"
          className="mx-auto my-10 h-24"
        />
        {children}
      </div>
    </div>
  )
}
