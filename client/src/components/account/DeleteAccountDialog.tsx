import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
  isDeleting,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('')

  const canDelete =
    confirmText.trim().toLowerCase() === email.toLowerCase() && !isDeleting

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (isDeleting) return
        if (!v) setConfirmText('')
        onOpenChange(v)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and all of your data —
            applications, cover letters, answers, and profile.{' '}
            <span className="font-medium text-destructive">
              This cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delete-account-confirm" className="text-sm">
            Type <span className="font-semibold text-foreground">{email}</span>{' '}
            to confirm
          </Label>
          <Input
            id="delete-account-confirm"
            type="email"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canDelete}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              'Delete account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
