import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/api/profile'),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      api.put<Profile>('/api/profile', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
    },
  })
}
