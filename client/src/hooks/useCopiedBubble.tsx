import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function useCopiedBubble() {
  const [state, setState] = useState<'idle' | 'in' | 'out'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function trigger() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState('in')
    timerRef.current = setTimeout(() => {
      setState('out')
      timerRef.current = setTimeout(() => setState('idle'), 280)
    }, 1200)
  }

  const bubble =
    state !== 'idle' ? (
      <div
        className={cn(
          'pointer-events-none absolute -top-8 left-1/2 z-20 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-background',
          state === 'in' ? 'animate-bubble-in' : 'animate-bubble-out',
        )}
      >
        Copied!
      </div>
    ) : null

  return { trigger, bubble }
}
