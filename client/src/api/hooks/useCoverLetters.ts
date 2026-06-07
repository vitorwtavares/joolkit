import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export const COVER_LETTER_VARIATION_LIMIT = 10

export interface CoverLetterTemplate {
  id: string
  user_id: string
  variation: string
  position: number
  label: string
  file_url: string | null
  content: unknown
  created_at: string
  updated_at: string
}

export function useCoverLetters() {
  return useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => api.get<CoverLetterTemplate[]>('/api/cover-letters'),
  })
}

export function useDeleteCoverLetterTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variation: string) =>
      api.delete<CoverLetterTemplate[] | void>(
        `/api/cover-letters/${encodeURIComponent(variation)}`,
      ),
    onSuccess: (data, variation) => {
      if (Array.isArray(data)) {
        queryClient.setQueryData<CoverLetterTemplate[]>(['cover-letters'], data)
        return
      }
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) => prev?.filter((t) => t.variation !== variation) ?? [],
      )
    },
  })
}

export function useUpdateCoverLetterContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      variation,
      content,
    }: {
      variation: string
      content: unknown
    }) =>
      api.put<CoverLetterTemplate>(
        `/api/cover-letters/${encodeURIComponent(variation)}`,
        {
          content,
        },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) =>
          prev?.map((t) => (t.variation === data.variation ? data : t)) ?? [
            data,
          ],
      )
    },
  })
}

export function useRestoreCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variation: string) =>
      api.post<CoverLetterTemplate>(
        `/api/cover-letters/${encodeURIComponent(variation)}/restore`,
        {},
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) =>
          prev?.map((t) => (t.variation === data.variation ? data : t)) ?? [
            data,
          ],
      )
    },
  })
}

export function useExportCoverLetterPDF() {
  return useMutation({
    mutationFn: async (variation: string) => {
      const blob = await api.postBlob(
        `/api/export/cover-letter/${encodeURIComponent(variation)}`,
      )
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'cover-letter.pdf'
      a.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
    },
  })
}

export function useCreateCoverLetterVariation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file_url,
      label,
    }: {
      file_url?: string | null
      label?: string
    }) =>
      api.post<CoverLetterTemplate>('/api/cover-letters', {
        file_url,
        label,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) => {
          if (!prev) return [data]
          return [...prev, data].sort((a, b) => a.position - b.position)
        },
      )
    },
  })
}

export function useUpdateCoverLetterFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      variation,
      file_url,
    }: {
      variation: string
      file_url: string
    }) =>
      api.put<CoverLetterTemplate>(
        `/api/cover-letters/${encodeURIComponent(variation)}/file`,
        {
          file_url,
        },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) => {
          if (!prev) return [data]
          const exists = prev.some((t) => t.variation === data.variation)
          return exists
            ? prev.map((t) => (t.variation === data.variation ? data : t))
            : [...prev, data]
        },
      )
    },
  })
}

export function useUpdateCoverLetterLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ variation, label }: { variation: string; label: string }) =>
      api.put<CoverLetterTemplate>(
        `/api/cover-letters/${encodeURIComponent(variation)}`,
        { label },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<CoverLetterTemplate[]>(
        ['cover-letters'],
        (prev) =>
          prev?.map((template) =>
            template.variation === data.variation ? data : template,
          ) ?? [data],
      )
    },
  })
}
