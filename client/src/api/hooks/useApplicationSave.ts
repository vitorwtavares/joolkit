import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '../api'
import {
  useUpdateApplication,
  type Application,
  type CreateApplicationPayload,
} from './useApplications'

function getAppValue(app: Application, key: string): unknown {
  switch (key) {
    case 'company_name':
      return app.company_name
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

export function useApplicationSave(app: Application) {
  const { mutate: update } = useUpdateApplication()
  const queryClient = useQueryClient()

  return function save(fields: CreateApplicationPayload) {
    const hasChange = Object.entries(fields).some(([key, value]) => {
      if (key === 'skill_ids') {
        const current = app.skills
          .map((s) => s.skill.id)
          .sort()
          .join()
        const next = [...(value as string[])].sort().join()
        return current !== next
      }
      return getAppValue(app, key) !== value
    })
    if (!hasChange) return

    update(
      { id: app.id, known_updated_at: app.updated_at, ...fields },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            toast.error('This record was updated elsewhere — reloading')
            queryClient.invalidateQueries({ queryKey: ['applications'] })
          } else {
            toast.error('Failed to save')
          }
        },
      },
    )
  }
}
