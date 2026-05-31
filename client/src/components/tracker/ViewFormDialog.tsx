import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ViewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'rename'
  initialName?: string
  // Overrides the default body copy — used when the dialog is opened to capture
  // a filter the user tried to apply to the permanent "All" view.
  description?: string
  isSubmitting: boolean
  onSubmit: (name: string) => void
}

// Create/rename dialog for tracker views. The body is split out so it remounts
// each time the dialog opens (Radix unmounts content when closed), keeping the
// name input seeded from the current `initialName` without an effect.
export function ViewFormDialog({
  open,
  onOpenChange,
  mode,
  initialName = '',
  description,
  isSubmitting,
  onSubmit,
}: ViewFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <ViewForm
          mode={mode}
          initialName={initialName}
          description={description}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}

function ViewForm({
  mode,
  initialName,
  description,
  isSubmitting,
  onSubmit,
}: Pick<
  ViewFormDialogProps,
  'mode' | 'description' | 'isSubmitting' | 'onSubmit'
> & {
  initialName: string
}) {
  const [name, setName] = useState(initialName)
  const isCreate = mode === 'create'
  const trimmed = name.trim()
  const disabled =
    isSubmitting || !trimmed || (!isCreate && trimmed === initialName.trim())

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled) onSubmit(trimmed)
      }}
    >
      <DialogHeader>
        <DialogTitle>{isCreate ? 'New view' : 'Rename view'}</DialogTitle>
        <DialogDescription>
          {description ??
            (isCreate
              ? 'Create a saved view of your applications.'
              : 'Give this view a new name.')}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="view-name" className="sr-only">
          View name
        </Label>
        <Input
          id="view-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="View name"
          maxLength={50}
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={disabled} className="min-w-[84px]">
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isCreate ? (
            'Create'
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
