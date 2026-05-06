import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useApplicationSave } from '@/api/hooks/useApplicationSave'
import { useDeleteApplication } from '@/api/hooks/useApplications'
import { DrawerHeader } from './DrawerHeader'
import { DrawerMetaFields } from './DrawerMetaFields'
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

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(v) => {
          if (!isDeleting) setConfirmDelete(v)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {app.company_name
                ? `This will permanently remove ${app.company_name} from your tracker.`
                : 'This will permanently remove this application from your tracker.'}{' '}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
