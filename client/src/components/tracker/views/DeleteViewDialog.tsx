import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this view?"
      description={`${viewName ? `This will remove the "${viewName}" view.` : 'This will remove this view.'} Your applications won't be affected.`}
      confirmLabel="Delete"
      isConfirming={isDeleting}
      onConfirm={onConfirm}
    />
  )
}
