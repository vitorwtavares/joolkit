import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const COOLDOWN_MS = 3000

export function useDownloadBubble() {
  const [state, setState] = useState<'idle' | 'in' | 'out'>('idle')
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  function trigger() {
    if (isOnCooldown) return

    setIsOnCooldown(true)
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(
      () => setIsOnCooldown(false),
      COOLDOWN_MS,
    )

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setState('in')
    bubbleTimerRef.current = setTimeout(() => {
      setState('out')
      bubbleTimerRef.current = setTimeout(() => setState('idle'), 280)
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
        Download started
      </div>
    ) : null

  return { trigger, bubble, isOnCooldown }
}
