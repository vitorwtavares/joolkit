import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  useTrackerDraftContext,
  type ApplicationDraftPatch,
} from './TrackerDraftContext'
import type { Application, Location, Skill } from '@/api/hooks/useApplications'

function mergeAppWithPatch(
  app: Application,
  patch: ApplicationDraftPatch,
  queryClient: QueryClient,
): Application {
  const merged: Application = { ...app }
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'skill_ids') {
      const ids = (value as string[] | undefined) ?? []
      const skills = queryClient.getQueryData<Skill[]>(['skills']) ?? []
      const byId = new Map(skills.map((s) => [s.id, s]))
      merged.skills = ids.map((id) => ({
        skill: byId.get(id) ??
          app.skills.find((s) => s.skill.id === id)?.skill ?? {
            id,
            name: '…',
          },
      }))
    } else if (key === 'location_id') {
      const locId = value as string | null
      merged.location_id = locId
      if (locId === null) {
        merged.location = null
      } else {
        const locations =
          queryClient.getQueryData<Location[]>(['locations']) ?? []
        merged.location =
          locations.find((l) => l.id === locId) ??
          (app.location_id === locId ? app.location : null)
      }
    } else {
      ;(merged as unknown as Record<string, unknown>)[key] = value
    }
  }
  return merged
}

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
    if (!draft || Object.keys(draft).length === 0) return app
    return mergeAppWithPatch(app, draft, queryClient)
  }, [app, draft, queryClient])
}
