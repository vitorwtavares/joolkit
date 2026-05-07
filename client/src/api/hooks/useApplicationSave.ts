import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '../api'
import {
  getCachedApplication,
  patchApplicationInCache,
  useUpdateApplication,
  type Application,
  type CreateApplicationPayload,
} from './useApplications'

interface AppSaveState {
  inFlight: boolean
  knownUpdatedAt: string
  lastServerApp: Application
  pending: CreateApplicationPayload | null
}

const appSaveState = new Map<string, AppSaveState>()

function getSaveState(app: Application): AppSaveState {
  const existing = appSaveState.get(app.id)
  if (existing) return existing

  const next: AppSaveState = {
    inFlight: false,
    knownUpdatedAt: app.updated_at,
    lastServerApp: app,
    pending: null,
  }
  appSaveState.set(app.id, next)
  return next
}

function mergeFields(
  current: CreateApplicationPayload | null,
  next: CreateApplicationPayload,
): CreateApplicationPayload {
  return { ...(current ?? {}), ...next }
}

function sameSkillIds(
  left: string[] | undefined,
  right: string[] | undefined,
): boolean {
  if (left === right) return true
  if (!left || !right) return false
  if (left.length !== right.length) return false

  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.every((id, index) => id === sortedRight[index])
}

function getAppValue(app: Application, key: string): unknown {
  switch (key) {
    case 'company_name':
      return app.company_name
    case 'job_name':
      return app.job_name
    case 'careers_url':
      return app.careers_url
    case 'job_url':
      return app.job_url
    case 'status':
      return app.status
    case 'location_id':
      return app.location_id
    case 'salary':
      return app.salary
    case 'work_style':
      return app.work_style
    case 'visa_support':
      return app.visa_support
    case 'is_favorite':
      return app.is_favorite
    case 'date_applied':
      return app.date_applied
    case 'next_deadline':
      return app.next_deadline
    case 'notes':
      return app.notes
    default:
      return undefined
  }
}

function hasChange(app: Application, fields: CreateApplicationPayload) {
  return Object.entries(fields).some(([key, value]) => {
    if (key === 'skill_ids') {
      return !sameSkillIds(
        app.skills.map((s) => s.skill.id),
        value as string[] | undefined,
      )
    }

    return getAppValue(app, key) !== value
  })
}

export function useApplicationSave(app: Application) {
  const { mutateAsync: update } = useUpdateApplication()
  const queryClient = useQueryClient()

  useEffect(() => {
    const state = getSaveState(app)
    if (state.lastServerApp.updated_at !== app.updated_at) {
      state.lastServerApp = app
      state.knownUpdatedAt = app.updated_at
    }
  }, [app])

  return function save(fields: CreateApplicationPayload) {
    const state = getSaveState(app)
    const currentApp = getCachedApplication(queryClient, app.id) ?? app
    if (!hasChange(currentApp, fields)) return

    const runSave = async (payload: CreateApplicationPayload) => {
      state.inFlight = true

      try {
        const data = await update({
          id: app.id,
          known_updated_at: state.knownUpdatedAt,
          ...payload,
        })

        state.inFlight = false
        state.knownUpdatedAt = data.updated_at
        state.lastServerApp = data

        if (!state.pending) return

        const nextPayload = state.pending
        state.pending = null

        if (hasChange(state.lastServerApp, nextPayload)) {
          await runSave(nextPayload)
        }
      } catch (err) {
        state.inFlight = false
        state.pending = null
        queryClient.invalidateQueries({ queryKey: ['applications'] })

        if (err instanceof ApiError && err.status === 409) {
          toast.error('This record was updated elsewhere — reloading')
        } else {
          toast.error('Failed to save')
        }
      }
    }

    if (state.inFlight) {
      patchApplicationInCache(queryClient, app.id, fields)
      state.pending = mergeFields(state.pending, fields)
      return
    }

    void runSave(fields)
  }
}
