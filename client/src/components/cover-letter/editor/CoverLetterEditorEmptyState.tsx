import { FilePlus, Loader2, Upload } from 'lucide-react'
import { FREE_COVER_LETTER_VARIATION_LIMIT } from '@/components/billing/planData'
import { cn } from '@/lib/utils'

interface CoverLetterEditorEmptyStateProps {
  busy?: boolean
  limit?: number
  onUpload: () => void
  onStartFromScratch: () => void
}

export function CoverLetterEditorEmptyState({
  busy = false,
  limit = FREE_COVER_LETTER_VARIATION_LIMIT,
  onUpload,
  onStartFromScratch,
}: CoverLetterEditorEmptyStateProps) {
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center text-center">
      <h2 className="text-[20px] font-semibold text-foreground">
        Create your first cover letter
      </h2>
      <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-muted-foreground">
        Upload a PDF to start from an existing letter, or start from scratch and
        write one here. You can add up to {limit} variations.
      </p>

      <div className="mt-8 flex w-full max-w-[360px] flex-col gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onUpload}
          className={cn(
            'flex min-h-[48px] cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-border-strong bg-secondary px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:border-brand-border hover:bg-surface-selected disabled:pointer-events-none disabled:opacity-60',
            busy && 'opacity-60',
          )}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : (
            <Upload size={18} className="text-muted-foreground" />
          )}
          Upload a file
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onStartFromScratch}
          className={cn(
            'flex min-h-[48px] cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-border-strong bg-secondary px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:border-brand-border hover:bg-surface-selected disabled:pointer-events-none disabled:opacity-60',
            busy && 'opacity-60',
          )}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : (
            <FilePlus size={18} className="text-muted-foreground" />
          )}
          Start from scratch
        </button>
      </div>
    </div>
  )
}
