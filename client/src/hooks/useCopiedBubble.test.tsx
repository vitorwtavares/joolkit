import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useCopiedBubble } from './useCopiedBubble'

describe('useCopiedBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle state with no bubble', () => {
    const { result } = renderHook(() => useCopiedBubble())
    expect(result.current.bubble).toBeNull()
  })

  it('shows bubble with animate-bubble-in class after trigger()', () => {
    const { result } = renderHook(() => useCopiedBubble())

    act(() => {
      result.current.trigger()
    })

    expect(result.current.bubble).not.toBeNull()
    // bubble element should have the in animation class
    const bubble = result.current.bubble as ReactElement<{ className: string }>
    expect(bubble.props.className).toContain('animate-bubble-in')
  })

  it('transitions to animate-bubble-out after 1200ms', () => {
    const { result } = renderHook(() => useCopiedBubble())

    act(() => {
      result.current.trigger()
    })
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    const bubble = result.current.bubble as ReactElement<{ className: string }>
    expect(bubble).not.toBeNull()
    expect(bubble.props.className).toContain('animate-bubble-out')
  })

  it('returns to idle (null bubble) after 1200ms + 280ms', () => {
    const { result } = renderHook(() => useCopiedBubble())

    act(() => {
      result.current.trigger()
    })
    act(() => {
      vi.advanceTimersByTime(1200 + 280)
    })

    expect(result.current.bubble).toBeNull()
  })

  it('resets the timer on rapid double trigger', () => {
    const { result } = renderHook(() => useCopiedBubble())

    act(() => {
      result.current.trigger()
    })
    // Partially advance (not enough to transition)
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Second trigger — restarts the timer
    act(() => {
      result.current.trigger()
    })

    // 1200ms from the second trigger should be in 'out' state
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    const bubble = result.current.bubble as ReactElement<{ className: string }>
    expect(bubble.props.className).toContain('animate-bubble-out')

    // Full 280ms more → idle
    act(() => {
      vi.advanceTimersByTime(280)
    })
    expect(result.current.bubble).toBeNull()
  })

  it('clears timers on unmount without causing state update warnings', () => {
    const { result, unmount } = renderHook(() => useCopiedBubble())

    act(() => {
      result.current.trigger()
    })

    // Unmount mid-timer — should not throw or warn
    expect(() => unmount()).not.toThrow()

    // Advancing time after unmount should not cause issues
    act(() => {
      vi.advanceTimersByTime(2000)
    })
  })
})
