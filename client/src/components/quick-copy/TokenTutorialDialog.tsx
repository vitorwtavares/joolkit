import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'

interface TokenTutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TokenTutorialDialog({
  open,
  onOpenChange,
}: TokenTutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">How to use tokens</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Tokens are placeholders you add directly to your cover letter PDF.
            When you download, noloop replaces them with the values you set.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
          <p>Add these two tokens anywhere in your cover letter text:</p>
          <div className="flex flex-col gap-2 rounded-md bg-secondary p-3 text-[14px]">
            <div>
              <code className="font-mono text-foreground">{TOKEN_ROLE}</code>
              <span className="ml-2 text-muted-foreground">
                → job title (e.g. Software Engineer)
              </span>
            </div>
            <div>
              <code className="font-mono text-foreground">{TOKEN_COMPANY}</code>
              <span className="ml-2 text-muted-foreground">
                → company name (e.g. Xiaomi)
              </span>
            </div>
          </div>
          <p>
            Upload the PDF here, fill in the token values, then click a slot to
            download your personalised cover letter.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
