import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteApplication } from '@/api/hooks/useApplications'
import { useResolvedApp, useTrackerDraft } from '../draft'
import { DrawerHeader } from './DrawerHeader'
import { DrawerMetaFields } from './DrawerMetaFields'
import { NotesEditor } from './NotesEditor'
import { DeleteApplicationDialog } from '../DeleteApplicationDialog'
import type { Application } from '@/api/hooks/useApplications'

interface ApplicationDrawerProps {
  app: Application
  onClose: () => void
  onDelete: () => void
}

export function ApplicationDrawer({
  app: serverApp,
  onClose,
  onDelete,
}: ApplicationDrawerProps) {
  const app = useResolvedApp(serverApp)
  const draft = useTrackerDraft(app.id)
  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    deleteApp(app.id, {
      onSuccess: () => {
        draft.clear()
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
          save={draft.apply}
          onClose={onClose}
          onDeleteClick={() => setConfirmDelete(true)}
        />

        <div className="flex flex-1 flex-col overflow-y-auto">
          <DrawerMetaFields app={app} save={draft.apply} />
          <NotesEditor app={app} save={draft.apply} />
        </div>
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
