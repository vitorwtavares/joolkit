import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DeleteApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteApplicationDialog({
  open,
  onOpenChange,
  companyName,
  isDeleting,
  onConfirm,
}: DeleteApplicationDialogProps) {
  const description = companyName
    ? `This will permanently remove ${companyName} from your tracker. This cannot be undone.`
    : 'This will permanently remove this application from your tracker. This cannot be undone.'

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this application?"
      description={description}
      confirmLabel="Delete"
      isConfirming={isDeleting}
      onConfirm={onConfirm}
    />
  )
}
