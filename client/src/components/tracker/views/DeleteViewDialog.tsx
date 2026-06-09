import { Loader2 } from 'lucide-react'
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

interface DeleteViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewName: string | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteViewDialog({
  open,
  onOpenChange,
  viewName,
  isDeleting,
  onConfirm,
}: DeleteViewDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isDeleting) onOpenChange(v)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this view?</AlertDialogTitle>
          <AlertDialogDescription>
            {viewName
              ? `This will remove the "${viewName}" view.`
              : 'This will remove this view.'}{' '}
            Your applications won't be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
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
  )
}
