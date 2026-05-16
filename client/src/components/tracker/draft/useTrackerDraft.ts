import { useMemo } from 'react'
import {
  useTrackerDraftContext,
  type ApplicationDraftPatch,
} from './TrackerDraftContext'

export interface TrackerDraftHandle {
  apply: (patch: ApplicationDraftPatch) => void
  clear: () => void
}

export function useTrackerDraft(appId: string): TrackerDraftHandle {
  const { applyDraft, clearDraft } = useTrackerDraftContext()
  return useMemo(
    () => ({
      apply: (patch: ApplicationDraftPatch) => applyDraft(appId, patch),
      clear: () => clearDraft(appId),
    }),
    [appId, applyDraft, clearDraft],
  )
}
