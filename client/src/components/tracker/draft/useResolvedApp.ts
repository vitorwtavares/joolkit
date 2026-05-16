import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTrackerDraftContext } from './TrackerDraftContext'
import {
  expandApplicationReferences,
  type Application,
} from '@/api/hooks/useApplications'

export function useResolvedApp(app: Application): Application {
  const { getDraftFor, subscribeToApp } = useTrackerDraftContext()
  const queryClient = useQueryClient()

  const subscribe = useCallback(
    (listener: () => void) => subscribeToApp(app.id, listener),
    [subscribeToApp, app.id],
  )
  const getSnapshot = useCallback(
    () => getDraftFor(app.id),
    [getDraftFor, app.id],
  )
  const draft = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return useMemo(() => {
    if (!draft) return app
    return {
      ...app,
      ...draft,
      ...expandApplicationReferences(queryClient, draft, app),
    }
  }, [app, draft, queryClient])
}
