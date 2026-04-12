import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pingServer } from './pingServer'

const STORAGE_KEY = btoa('server_last_ping')

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
})

describe('pingServer', () => {
  it('fires a fetch on first call', () => {
    pingServer()
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/health')
  })

  it('writes an encoded timestamp to localStorage', () => {
    const before = Date.now()
    pingServer()
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const decoded = Number(atob(raw!))
    expect(decoded).toBeGreaterThanOrEqual(before)
    expect(decoded).toBeLessThanOrEqual(Date.now())
  })

  it('does not fire again within the interval', () => {
    pingServer()
    pingServer()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('fires again after the interval has elapsed', () => {
    pingServer()
    const expired = Date.now() - 11 * 60 * 1000 // 11 minutes ago
    localStorage.setItem(STORAGE_KEY, btoa(String(expired)))
    pingServer()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
