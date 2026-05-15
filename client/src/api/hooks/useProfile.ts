import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/auth'
import { api } from '../api'

export interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  linkedin: string | null
  github: string | null
  portfolio: string | null
  other_link: string | null
  resume_url: string | null
  created_at: string
  updated_at: string
}

export type UpdateProfilePayload = Partial<
  Pick<
    Profile,
    | 'name'
    | 'email'
    | 'phone'
    | 'address'
    | 'linkedin'
    | 'github'
    | 'portfolio'
    | 'other_link'
    | 'resume_url'
  >
>

const PROFILE_GC_TIME = 24 * 60 * 60 * 1000

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.get<Profile>('/api/profile'),
    enabled: !!user,
    gcTime: PROFILE_GC_TIME,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      api.put<Profile>('/api/profile', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data)
    },
  })
}
