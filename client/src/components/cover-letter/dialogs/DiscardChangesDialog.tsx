import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DiscardChangesDialogProps {
  open: boolean
  onKeepEditing: () => void
  onDiscard: () => void
}

export function DiscardChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeepEditing()
      }}
      title="Discard unsaved changes?"
      description="This variation has unsaved edits. Continuing will switch away and discard them. This cannot be undone."
      cancelLabel="Keep editing"
      confirmLabel="Discard changes"
      onConfirm={onDiscard}
    />
  )
}
