import { useMutation } from '@tanstack/react-query'
import { api } from '../api'

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.delete<void>('/api/account'),
  })
}
