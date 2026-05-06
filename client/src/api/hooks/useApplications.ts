import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { api } from '../api'
import type { Skill } from './useSkills'
import type { Location } from './useLocations'

type SkillRef = Pick<Skill, 'id' | 'name'>
type LocationRef = Pick<Location, 'id' | 'name'>

export type { Skill, Location }

export interface Application {
  id: string
  user_id: string
  company_name: string
  job_name: string | null
  careers_url: string | null
  job_url: string | null
  status: ApplicationStatus
  location_id: string | null
  location: LocationRef | null
  salary: string | null
  work_style: 'remote' | 'hybrid' | 'on-site' | null
  visa_support: 'yes' | 'no' | 'unknown' | null
  is_favorite: boolean
  date_applied: string | null
  next_deadline: string | null
  notes: Record<string, unknown> | null
  last_moved_at: string | null
  created_at: string
  updated_at: string
  skills: { skill: SkillRef }[]
}

export type ApplicationStatus =
  | 'prospect'
  | 'no_openings'
  | 'ready_to_apply'
  | 'applied'
  | 'pending_schedule'
  | 'interview_scheduled'
  | 'awaiting_response'
  | 'technical_test'
  | 'offer_received'
  | 'rejected'
  | 'rejected_ghosted'
  | 'signed'

export type ApplicationView =
  | 'all'
  | 'prospects'
  | 'ready'
  | 'applied'
  | 'in-progress'
  | 'no-openings'
  | 'rejected'
  | 'favorites'

export type CreateApplicationPayload = {
  company_name?: string
  job_name?: string | null
  careers_url?: string | null
  job_url?: string | null
  status?: ApplicationStatus
  location_id?: string | null
  salary?: string | null
  work_style?: 'remote' | 'hybrid' | 'on-site' | null
  visa_support?: 'yes' | 'no' | 'unknown' | null
  is_favorite?: boolean
  date_applied?: string | null
  next_deadline?: string | null
  notes?: Record<string, unknown> | null
  skill_ids?: string[]
}

export type UpdateApplicationPayload = {
  id: string
  known_updated_at: string
} & CreateApplicationPayload

export function useApplications(view: ApplicationView = 'all') {
  return useQuery({
    queryKey: ['applications', view],
    queryFn: () => api.get<Application[]>(`/api/applications?view=${view}`),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', 'detail', id],
    queryFn: () => api.get<Application>(`/api/applications/${id}`),
    enabled: !!id,
  })
}

function appMatchesView(app: Application, view: string): boolean {
  switch (view) {
    case 'all':
      return true
    case 'prospects':
      return app.status === 'prospect'
    case 'ready':
      return app.status === 'ready_to_apply'
    case 'applied':
      return app.status === 'applied'
    case 'in-progress':
      return [
        'pending_schedule',
        'interview_scheduled',
        'awaiting_response',
        'technical_test',
        'offer_received',
      ].includes(app.status)
    case 'no-openings':
      return app.status === 'no_openings'
    case 'rejected':
      return app.status === 'rejected' || app.status === 'rejected_ghosted'
    case 'favorites':
      return app.is_favorite
    default:
      return false
  }
}

function insertByCreatedAt(
  list: Application[],
  app: Application,
): Application[] {
  const result = [...list]
  const newAt = new Date(app.created_at).getTime()
  const idx = result.findIndex((a) => new Date(a.created_at).getTime() <= newAt)
  if (idx === -1) result.push(app)
  else result.splice(idx, 0, app)
  return result
}

function syncRowAcrossViews(
  queryClient: ReturnType<typeof useQueryClient>,
  app: Application,
  prevId?: string,
) {
  const lookupId = prevId ?? app.id
  for (const [key, data] of queryClient.getQueriesData<Application[]>({
    queryKey: ['applications'],
  })) {
    if (!Array.isArray(data)) continue
    const view = String(key[1] ?? 'all')
    const idx = data.findIndex((a) => a.id === lookupId)
    const matches = appMatchesView(app, view)
    if (idx === -1) {
      if (matches) {
        queryClient.setQueryData<Application[]>(
          key,
          insertByCreatedAt(data, app),
        )
      }
    } else if (matches) {
      const next = [...data]
      next[idx] = app
      queryClient.setQueryData<Application[]>(key, next)
    } else {
      queryClient.setQueryData<Application[]>(
        key,
        data.filter((a) => a.id !== lookupId),
      )
    }
  }
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) =>
      api.post<Application>('/api/applications', payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      const snapshot = queryClient.getQueriesData<Application[] | Application>({
        queryKey: ['applications'],
      })

      const tempId = `temp-${crypto.randomUUID()}`
      const now = new Date().toISOString()
      const locations = queryClient.getQueryData<Location[]>(['locations'])
      const skills = queryClient.getQueryData<Skill[]>(['skills'])

      const optimisticApp: Application = {
        id: tempId,
        user_id: '',
        company_name: payload.company_name ?? '',
        job_name: payload.job_name ?? null,
        careers_url: payload.careers_url ?? null,
        job_url: payload.job_url ?? null,
        status: payload.status ?? 'prospect',
        location_id: payload.location_id ?? null,
        location: payload.location_id
          ? (locations?.find((l) => l.id === payload.location_id) ?? null)
          : null,
        salary: payload.salary ?? null,
        work_style: payload.work_style ?? null,
        visa_support: payload.visa_support ?? null,
        is_favorite: payload.is_favorite ?? false,
        date_applied: payload.date_applied ?? null,
        next_deadline: payload.next_deadline ?? null,
        notes: payload.notes ?? null,
        last_moved_at: now,
        created_at: now,
        updated_at: now,
        skills: (payload.skill_ids ?? []).map((sid) => ({
          skill: skills?.find((s) => s.id === sid) ?? { id: sid, name: '…' },
        })),
      }

      for (const [key, data] of queryClient.getQueriesData<Application[]>({
        queryKey: ['applications'],
      })) {
        if (!Array.isArray(data)) continue
        const view = String(key[1] ?? 'all')
        if (appMatchesView(optimisticApp, view)) {
          queryClient.setQueryData<Application[]>(key, [optimisticApp, ...data])
        }
      }

      return { snapshot, tempId }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]: [QueryKey, unknown]) =>
        queryClient.setQueryData(key, data),
      )
    },
    onSuccess: (newApp, _vars, ctx) => {
      syncRowAcrossViews(queryClient, newApp, ctx?.tempId)
      queryClient.setQueryData(['applications', 'detail', newApp.id], newApp)
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateApplicationPayload) =>
      api.put<Application>(`/api/applications/${id}`, payload),
    onMutate: async ({ id, skill_ids, location_id, ...simpleFields }) => {
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      const snapshot = queryClient.getQueriesData<Application[] | Application>({
        queryKey: ['applications'],
      })

      const patch: Partial<Application> = { ...simpleFields }

      if (simpleFields.status !== undefined) {
        patch.last_moved_at = new Date().toISOString()
      }

      if (location_id !== undefined) {
        patch.location_id = location_id
        if (location_id === null) {
          patch.location = null
        } else {
          const locations = queryClient.getQueryData<Location[]>(['locations'])
          patch.location = locations?.find((l) => l.id === location_id) ?? null
        }
      }

      if (skill_ids !== undefined) {
        const skills = queryClient.getQueryData<Skill[]>(['skills'])
        patch.skills = skill_ids.map((sid) => ({
          skill: skills?.find((s) => s.id === sid) ?? { id: sid, name: '…' },
        }))
      }

      for (const [key, data] of queryClient.getQueriesData<Application[]>({
        queryKey: ['applications'],
      })) {
        if (!Array.isArray(data)) continue
        const view = String(key[1] ?? 'all')
        const idx = data.findIndex((a) => a.id === id)
        if (idx === -1) continue
        const patched: Application = { ...data[idx], ...patch }
        if (appMatchesView(patched, view)) {
          const next = [...data]
          next[idx] = patched
          queryClient.setQueryData<Application[]>(key, next)
        } else {
          queryClient.setQueryData<Application[]>(
            key,
            data.filter((a) => a.id !== id),
          )
        }
      }

      queryClient.setQueryData<Application>(
        ['applications', 'detail', id],
        (old) => (old ? { ...old, ...patch } : old),
      )

      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]: [QueryKey, unknown]) =>
        queryClient.setQueryData(key, data),
      )
    },
    onSuccess: (data) => {
      syncRowAcrossViews(queryClient, data)
      queryClient.setQueryData(['applications', 'detail', data.id], data)
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/api/applications/${id}`),
    onSuccess: (_data, id) => {
      for (const [key, data] of queryClient.getQueriesData<Application[]>({
        queryKey: ['applications'],
      })) {
        if (!Array.isArray(data)) continue
        queryClient.setQueryData<Application[]>(
          key,
          data.filter((a) => a.id !== id),
        )
      }
      queryClient.removeQueries({ queryKey: ['applications', 'detail', id] })
    },
  })
}
