import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { COVER_LETTER_TOKEN_EXAMPLE } from '@/constants'
import { TokenPill } from './TokenPill'

interface TokenTutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: 'quick-copy' | 'editor'
}

export function TokenTutorialDialog({
  open,
  onOpenChange,
  variant = 'quick-copy',
}: TokenTutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">How to use tokens</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Tokens are placeholders in your cover letter. When you download,
            joolkit replaces them with the values you set in the tokens panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
          <p>
            Add tokens anywhere in your letter using double braces — for example{' '}
            <TokenPill tokenKey="company" /> or <TokenPill tokenKey="role" />.
            Create as many as you need; each key gets its own value in the
            panel.
          </p>
          <div className="flex flex-col gap-2 rounded-md bg-secondary p-3 text-[14px]">
            <div className="flex flex-wrap items-center gap-2">
              <TokenPill tokenKey={COVER_LETTER_TOKEN_EXAMPLE} />
              <span className="text-muted-foreground">
                becomes the value saved for company
              </span>
            </div>
          </div>
          {variant === 'editor' ? (
            <p>
              Type tokens directly in the editor, fill in values in the side
              panel, then download when every token used in the letter is
              resolved.
            </p>
          ) : (
            <p>
              Include tokens in your uploaded PDF or open the editor to add them
              there. Fill in the values, then download a variation to get your
              personalised cover letter.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
