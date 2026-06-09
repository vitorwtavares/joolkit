import { type CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
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
  const confirmCopy = pendingAction ? CONFIRM_COPY[pendingAction.type] : null

  return (
    <AlertDialog
      open={!!pendingAction}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmCopy?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={
              pendingAction?.type === 'remove' ? 'destructive' : 'default'
            }
            onClick={onConfirm}
          >
            {confirmCopy?.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
