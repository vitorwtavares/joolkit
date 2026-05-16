import { useMemo } from 'react'
import {
  useTrackerDraftContext,
  type ApplicationDraftPatch,
} from './TrackerDraftContext'

export interface TrackerDraftHandle {
  apply: (patch: ApplicationDraftPatch) => void
  flush: () => void
  clear: () => void
}

export function useTrackerDraft(appId: string): TrackerDraftHandle {
  const { applyDraft, flushDraft, clearDraft } = useTrackerDraftContext()
  return useMemo(
    () => ({
      apply: (patch: ApplicationDraftPatch) => applyDraft(appId, patch),
      flush: () => flushDraft(appId),
      clear: () => clearDraft(appId),
    }),
    [appId, applyDraft, flushDraft, clearDraft],
  )
}
