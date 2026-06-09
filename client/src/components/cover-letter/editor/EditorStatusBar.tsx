import { Info } from 'lucide-react'
import { TokenTutorialTrigger } from '../tokens/TokenTutorialTrigger'

interface EditorStatusBarProps {
  hasUnresolved: boolean
}

export function EditorStatusBar({ hasUnresolved }: EditorStatusBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border-subtle bg-surface-panel px-6 py-2.5">
      <div
        className={`flex min-w-0 items-center gap-1.5 text-[13px] ${hasUnresolved ? 'text-token-unresolved' : 'text-text-faint'}`}
      >
        {hasUnresolved ? (
          <>
            <Info className="size-[13px] shrink-0" />
            Fill in token values to enable PDF download.
          </>
        ) : (
          'Changes saved to this variation only. Tokens apply to all variations.'
        )}
      </div>
      <TokenTutorialTrigger variant="editor" className="shrink-0" />
    </div>
  )
}
