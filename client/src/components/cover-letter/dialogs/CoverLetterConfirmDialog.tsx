import { type CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export type PendingAction =
  | { type: 'upload'; variation: string | null; file: File }
  | { type: 'remove'; template: CoverLetterTemplate }
  | { type: 'restore' }
  | null

const CONFIRM_COPY: Record<
  Exclude<PendingAction, null>['type'],
  { title: string; description: string; action: string }
> = {
  upload: {
    title: 'Replace current content?',
    description:
      'Uploading this file will replace the content currently in this variation with the uploaded file. This cannot be undone.',
    action: 'Replace',
  },
  remove: {
    title: 'Remove this variation?',
    description:
      'This permanently removes the whole variation, including its uploaded file and any edited content. This cannot be undone.',
    action: 'Remove',
  },
  restore: {
    title: 'Restore original?',
    description:
      'This discards all edits and reloads the content from the original uploaded file. This cannot be undone.',
    action: 'Restore original',
  },
}

interface CoverLetterConfirmDialogProps {
  pendingAction: PendingAction
  onConfirm: () => void
  onCancel: () => void
}

export function CoverLetterConfirmDialog({
  pendingAction,
  onConfirm,
  onCancel,
}: CoverLetterConfirmDialogProps) {
  const copy = pendingAction ? CONFIRM_COPY[pendingAction.type] : null

  return (
    <ConfirmDialog
      open={!!pendingAction}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
      title={copy?.title ?? ''}
      description={copy?.description ?? ''}
      confirmLabel={copy?.action ?? ''}
      confirmVariant={
        pendingAction?.type === 'remove' ? 'destructive' : 'default'
      }
      onConfirm={onConfirm}
    />
  )
}
