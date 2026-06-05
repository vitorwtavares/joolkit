import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export const RESUME_VARIATION_LIMIT = 10

export interface ResumeVariation {
  id: string
  user_id: string
  position: number
  label: string
  file_url: string
  created_at: string
  updated_at: string
}

export function useResumes() {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get<ResumeVariation[]>('/api/resumes'),
  })
}

export function useUpdateResumeFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file_url }: { id: string; file_url: string }) =>
      api.put<ResumeVariation>(`/api/resumes/${id}/file`, {
        file_url,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<ResumeVariation[]>(['resumes'], (prev) => {
        if (!prev) return [data]
        return prev.map((resume) => (resume.id === data.id ? data : resume))
      })
    },
  })
}

export function useCreateResumeVariation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file_url, label }: { file_url: string; label?: string }) =>
      api.post<ResumeVariation>('/api/resumes', {
        file_url,
        label,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<ResumeVariation[]>(['resumes'], (prev) => {
        if (!prev) return [data]
        return [...prev, data].sort((a, b) => a.position - b.position)
      })
    },
  })
}

export function useDeleteResumeVariation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<ResumeVariation[]>(`/api/resumes/${id}`),
    onSuccess: (data) => {
      queryClient.setQueryData<ResumeVariation[]>(['resumes'], data)
    },
  })
}

export function useUpdateResumeLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      api.put<ResumeVariation>(`/api/resumes/${id}`, { label }),
    onSuccess: (data) => {
      queryClient.setQueryData<ResumeVariation[]>(
        ['resumes'],
        (prev) =>
          prev?.map((resume) => (resume.id === data.id ? data : resume)) ?? [
            data,
          ],
      )
    },
  })
}
