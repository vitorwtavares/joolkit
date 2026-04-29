import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  | 'favorites'

export type CreateApplicationPayload = {
  company_name?: string
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

export type UpdateApplicationPayload = { id: string } & CreateApplicationPayload

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

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) =>
      api.post<Application>('/api/applications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateApplicationPayload) =>
      api.put<Application>(`/api/applications/${id}`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['applications', 'detail', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/api/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
