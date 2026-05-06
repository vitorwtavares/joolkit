import { useState } from 'react'
import { toast } from 'sonner'
import { useApplicationSave } from '@/api/hooks/useApplicationSave'
import { useDeleteApplication } from '@/api/hooks/useApplications'
import { DrawerHeader } from './DrawerHeader'
import { DrawerMetaFields } from './DrawerMetaFields'
import { DeleteApplicationDialog } from '../DeleteApplicationDialog'
import type { Application } from '@/api/hooks/useApplications'

interface ApplicationDrawerProps {
  app: Application
  onClose: () => void
  onDelete: () => void
}

export function ApplicationDrawer({
  app,
  onClose,
  onDelete,
}: ApplicationDrawerProps) {
  const save = useApplicationSave(app)
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    deleteApp(app.id, {
      onSuccess: () => {
        setConfirmDelete(false)
        onDelete()
      },
      onError: () => {
        toast.error('Failed to delete')
        setConfirmDelete(false)
      },
    })
  }

  return (
    <>
      <div className="flex h-full w-[650px] flex-shrink-0 flex-col overflow-hidden bg-card">
        <DrawerHeader
          app={app}
          save={save}
          onClose={onClose}
          onDeleteClick={() => setConfirmDelete(true)}
        />
        <DrawerMetaFields app={app} save={save} />

        {/* Notes (next phase) */}
        <div className="flex-1 overflow-y-auto px-16 py-4" />
      </div>

      <DeleteApplicationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        companyName={app.company_name || null}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
