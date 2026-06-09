import { useCallback, useEffect, useRef, useState } from 'react'
import type { Application } from '@/api/hooks/useApplications'

export function useDrawerState(applications: Application[]) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mountedAppId, setMountedAppId] = useState<string | null>(null)
  const [mountedApp, setMountedApp] = useState<Application | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep mountedApp in sync with live list changes, but never set it to null
  // from here — that preserves the drawer content during an optimistic delete
  // until forceCloseDrawer explicitly clears it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!mountedAppId) {
      setMountedApp(null)
      return
    }
    const app = applications.find((a) => a.id === mountedAppId) ?? null
    if (app) setMountedApp(app)
  }, [applications, mountedAppId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const forceCloseDrawer = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(null)
    setDrawerOpen(false)
    setMountedAppId(null)
  }, [])

  const openDrawer = useCallback((id: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(id)
    setMountedAppId(id)
    requestAnimationFrame(() => setDrawerOpen(true))
  }, [])

  const closeDrawer = useCallback(() => {
    setSelectedAppId(null)
    setDrawerOpen(false)
    closeTimerRef.current = setTimeout(() => setMountedAppId(null), 150)
  }, [])

  return {
    selectedAppId,
    drawerOpen,
    mountedApp,
    forceCloseDrawer,
    openDrawer,
    closeDrawer,
  }
}
