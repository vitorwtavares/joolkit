import { Info } from 'lucide-react'

interface EditorStatusBarProps {
  hasUnresolved: boolean
}

export function EditorStatusBar({ hasUnresolved }: EditorStatusBarProps) {
  return (
    <div className="flex shrink-0 items-center border-t border-border-subtle bg-surface-panel px-6 py-2.5">
      <div
        className={`flex items-center gap-1.5 text-xs ${hasUnresolved ? 'text-danger' : 'text-text-faint'}`}
      >
        {hasUnresolved ? (
          <>
            <Info className="size-[13px] shrink-0" />
            Fill in token values to enable PDF download.
          </>
        ) : (
          'Changes saved to this variation only. Tokens apply to both variations.'
        )}
      </div>
    </div>
  )
}
