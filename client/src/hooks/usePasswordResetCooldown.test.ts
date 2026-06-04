import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatPasswordResetCooldown,
  usePasswordResetCooldown,
} from './usePasswordResetCooldown'

describe('usePasswordResetCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
  })

  async function advanceCooldown(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  it('starts with no active cooldown', () => {
    const { result } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isCoolingDown).toBe(false)
  })

  it('counts down after starting the next cooldown', async () => {
    const { result } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    act(() => {
      result.current.startNextCooldown()
    })

    expect(result.current.remainingSeconds).toBe(60)
    expect(result.current.isCoolingDown).toBe(true)
    expect(result.current.formattedRemaining).toBe('1m')

    await advanceCooldown(1000)

    expect(result.current.remainingSeconds).toBe(59)

    await advanceCooldown(59_000)

    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isCoolingDown).toBe(false)
  })

  it('progresses through the reset email cooldowns', async () => {
    const { result } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(60)
    await advanceCooldown(60_000)
    act(() => {
      result.current.refreshCooldown()
    })

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(180)
    await advanceCooldown(180_000)
    act(() => {
      result.current.refreshCooldown()
    })

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(600)
    await advanceCooldown(600_000)
    act(() => {
      result.current.refreshCooldown()
    })

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(3_600)
    await advanceCooldown(3_600_000)
    act(() => {
      result.current.refreshCooldown()
    })

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(86_400)
    await advanceCooldown(86_400_000)
    act(() => {
      result.current.refreshCooldown()
    })

    act(() => {
      result.current.startNextCooldown()
    })
    expect(result.current.remainingSeconds).toBe(86_400)
  })

  it('resets the progression after a week without reset requests', async () => {
    const { result } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    for (const cooldownSeconds of [60, 180, 600, 3_600, 86_400]) {
      act(() => {
        result.current.startNextCooldown()
      })
      expect(result.current.remainingSeconds).toBe(cooldownSeconds)
      await advanceCooldown(cooldownSeconds * 1000)
      act(() => {
        result.current.refreshCooldown()
      })
    }

    await advanceCooldown(7 * 24 * 60 * 60 * 1000 + 1000)
    act(() => {
      result.current.refreshCooldown()
      result.current.startNextCooldown()
    })

    expect(result.current.remainingSeconds).toBe(60)
  })

  it('persists cooldowns across hook remounts by normalized email', () => {
    const { result, unmount } = renderHook(() =>
      usePasswordResetCooldown('Person@Example.com '),
    )

    act(() => {
      result.current.startNextCooldown()
    })
    unmount()

    const { result: remounted } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    expect(remounted.current.remainingSeconds).toBe(60)
    expect(remounted.current.isCoolingDown).toBe(true)
  })

  it('does not expose the email or readable namespace in localStorage', () => {
    const { result } = renderHook(() =>
      usePasswordResetCooldown('person@example.com'),
    )

    act(() => {
      result.current.startNextCooldown()
    })

    const storageKey = window.localStorage.key(0) ?? ''
    const storageValue = window.localStorage.getItem(storageKey) ?? ''

    expect(storageKey).not.toContain('person@example.com')
    expect(storageKey).not.toContain('password')
    expect(storageValue).not.toContain('person@example.com')
    expect(storageValue).not.toContain('attempt')
    expect(storageValue).not.toContain('nextAllowedAt')
  })

  it('formats remaining cooldown time for button labels', () => {
    expect(formatPasswordResetCooldown(59)).toBe('59s')
    expect(formatPasswordResetCooldown(60)).toBe('1m')
    expect(formatPasswordResetCooldown(181)).toBe('4m')
    expect(formatPasswordResetCooldown(3_600)).toBe('1h')
    expect(formatPasswordResetCooldown(86_400)).toBe('24h')
  })
})
