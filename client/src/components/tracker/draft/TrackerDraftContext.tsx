import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/api/api'
import {
  getCachedApplication,
  useUpdateApplication,
  type CreateApplicationPayload,
} from '@/api/hooks/useApplications'

export type ApplicationDraftPatch = Partial<CreateApplicationPayload>
type DraftMap = Record<string, ApplicationDraftPatch>

const SAVE_DEBOUNCE_MS = 250

interface SaveState {
  inFlight: ApplicationDraftPatch | null
  knownUpdatedAt: string
  pending: boolean
}

interface TrackerDraftContextValue {
  applyDraft: (appId: string, patch: ApplicationDraftPatch) => void
  clearDraft: (appId: string) => void
  getDraftFor: (appId: string) => ApplicationDraftPatch | undefined
  subscribeToApp: (appId: string, listener: () => void) => () => void
}

const TrackerDraftContext = createContext<TrackerDraftContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useTrackerDraftContext() {
  const ctx = useContext(TrackerDraftContext)
  if (!ctx) {
    throw new Error(
      'useTrackerDraftContext must be used inside TrackerDraftProvider',
    )
  }
  return ctx
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    const sa = [...a].sort()
    const sb = [...b].sort()
    return sa.every((v, i) => v === sb[i])
  }
  return false
}

export function TrackerDraftProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { mutateAsync: update } = useUpdateApplication()

  // Draft state lives in a ref instead of useState so an edit on one row does
  // not re-render every other row through context. Subscribers fan out per app
  // id via the listener map, so only the affected row is notified.
  const draftMapRef = useRef<DraftMap>({})
  const updateRef = useRef(update)
  const queryClientRef = useRef<QueryClient>(queryClient)
  useEffect(() => {
    updateRef.current = update
    queryClientRef.current = queryClient
  })

  const saveStatesRef = useRef(new Map<string, SaveState>())
  const debounceRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const listenersRef = useRef(new Map<string, Set<() => void>>())

  const notifyApp = useCallback((appId: string) => {
    const listeners = listenersRef.current.get(appId)
    if (!listeners) return
    for (const listener of listeners) listener()
  }, [])

  const setDraftFor = useCallback(
    (
      appId: string,
      updater: (
        prev: ApplicationDraftPatch | undefined,
      ) => ApplicationDraftPatch | null,
    ) => {
      const current = draftMapRef.current
      const nextPatch = updater(current[appId])
      if (!nextPatch || Object.keys(nextPatch).length === 0) {
        if (!current[appId]) return
        const next = { ...current }
        delete next[appId]
        draftMapRef.current = next
      } else {
        if (current[appId] === nextPatch) return
        draftMapRef.current = { ...current, [appId]: nextPatch }
      }
      notifyApp(appId)
    },
    [notifyApp],
  )

  const ensureSaveState = useCallback((appId: string): SaveState => {
    let state = saveStatesRef.current.get(appId)
    if (!state) {
      const cached = getCachedApplication(queryClientRef.current, appId)
      state = {
        inFlight: null,
        knownUpdatedAt: cached?.updated_at ?? '',
        pending: false,
      }
      saveStatesRef.current.set(appId, state)
    } else if (!state.knownUpdatedAt) {
      const cached = getCachedApplication(queryClientRef.current, appId)
      if (cached) state.knownUpdatedAt = cached.updated_at
    }
    return state
  }, [])

  // runSave is held in a ref so it can re-enter itself (after a pending save)
  // without a useCallback dep cycle.
  const runSaveRef = useRef<(appId: string) => Promise<void>>(async () => {})

  const scheduleSave = useCallback((appId: string) => {
    const existing = debounceRef.current.get(appId)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => {
      debounceRef.current.delete(appId)
      void runSaveRef.current(appId)
    }, SAVE_DEBOUNCE_MS)
    debounceRef.current.set(appId, t)
  }, [])

  useEffect(() => {
    runSaveRef.current = async (appId: string) => {
      const draft = draftMapRef.current[appId]
      if (!draft || Object.keys(draft).length === 0) return

      const state = ensureSaveState(appId)
      if (state.inFlight) {
        state.pending = true
        return
      }

      const inFlight: ApplicationDraftPatch = { ...draft }
      state.inFlight = inFlight
      state.pending = false

      try {
        const data = await updateRef.current({
          id: appId,
          known_updated_at: state.knownUpdatedAt,
          ...inFlight,
        })
        state.inFlight = null
        state.knownUpdatedAt = data.updated_at

        setDraftFor(appId, (prev) => {
          if (!prev) return null
          const reduced: ApplicationDraftPatch = {}
          for (const [key, draftValue] of Object.entries(prev)) {
            if (key in inFlight) {
              const sentValue = (inFlight as Record<string, unknown>)[key]
              if (valuesEqual(draftValue, sentValue)) continue
            }
            ;(reduced as Record<string, unknown>)[key] = draftValue
          }
          return reduced
        })

        if (state.pending) {
          state.pending = false
          scheduleSave(appId)
        }
      } catch (err) {
        state.inFlight = null
        state.pending = false
        setDraftFor(appId, () => null)
        queryClientRef.current.invalidateQueries({ queryKey: ['applications'] })
        if (err instanceof ApiError && err.status === 409) {
          toast.error('This record was updated elsewhere — reloading')
        } else {
          toast.error('Failed to save')
        }
      }
    }
  })

  const applyDraft = useCallback(
    (appId: string, patch: ApplicationDraftPatch) => {
      setDraftFor(appId, (prev) => ({ ...(prev ?? {}), ...patch }))
      scheduleSave(appId)
    },
    [scheduleSave, setDraftFor],
  )

  const clearDraft = useCallback(
    (appId: string) => {
      const existing = debounceRef.current.get(appId)
      if (existing) {
        clearTimeout(existing)
        debounceRef.current.delete(appId)
      }
      saveStatesRef.current.delete(appId)
      setDraftFor(appId, () => null)
    },
    [setDraftFor],
  )

  const getDraftFor = useCallback(
    (appId: string) => draftMapRef.current[appId],
    [],
  )

  const subscribeToApp = useCallback((appId: string, listener: () => void) => {
    let listeners = listenersRef.current.get(appId)
    if (!listeners) {
      listeners = new Set()
      listenersRef.current.set(appId, listeners)
    }
    listeners.add(listener)
    return () => {
      const current = listenersRef.current.get(appId)
      if (!current) return
      current.delete(listener)
      if (current.size === 0) listenersRef.current.delete(appId)
    }
  }, [])

  useEffect(() => {
    const timers = debounceRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const value = useMemo<TrackerDraftContextValue>(
    () => ({
      applyDraft,
      clearDraft,
      getDraftFor,
      subscribeToApp,
    }),
    [applyDraft, clearDraft, getDraftFor, subscribeToApp],
  )

  return (
    <TrackerDraftContext.Provider value={value}>
      {children}
    </TrackerDraftContext.Provider>
  )
}
