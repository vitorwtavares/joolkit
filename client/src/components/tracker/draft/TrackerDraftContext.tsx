import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  draftMap: DraftMap
  applyDraft: (appId: string, patch: ApplicationDraftPatch) => void
  flushDraft: (appId: string) => void
  clearDraft: (appId: string) => void
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

  // The draft map is stored in a ref AND mirrored to state. The ref is the
  // synchronous source of truth — updated immediately on apply so that the
  // save coordinator (which runs synchronously after applyDraft) sees the
  // latest values without waiting for React to commit. State is only used
  // to trigger re-renders of consumers.
  const draftMapRef = useRef<DraftMap>({})
  const [draftMap, setDraftMap] = useState<DraftMap>({})

  const updateRef = useRef(update)
  const queryClientRef = useRef<QueryClient>(queryClient)
  useEffect(() => {
    updateRef.current = update
    queryClientRef.current = queryClient
  })

  const saveStatesRef = useRef(new Map<string, SaveState>())
  const debounceRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const commitDraft = useCallback((next: DraftMap) => {
    draftMapRef.current = next
    setDraftMap(next)
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
        commitDraft(next)
        return
      }
      if (current[appId] === nextPatch) return
      commitDraft({ ...current, [appId]: nextPatch })
    },
    [commitDraft],
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

  const flushDraft = useCallback((appId: string) => {
    const existing = debounceRef.current.get(appId)
    if (existing) {
      clearTimeout(existing)
      debounceRef.current.delete(appId)
    }
    void runSaveRef.current(appId)
  }, [])

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

  useEffect(() => {
    const timers = debounceRef.current
    return () => {
      for (const t of timers.values()) clearTimeout(t)
      timers.clear()
    }
  }, [])

  const value = useMemo<TrackerDraftContextValue>(
    () => ({ draftMap, applyDraft, flushDraft, clearDraft }),
    [draftMap, applyDraft, flushDraft, clearDraft],
  )

  return (
    <TrackerDraftContext.Provider value={value}>
      {children}
    </TrackerDraftContext.Provider>
  )
}
