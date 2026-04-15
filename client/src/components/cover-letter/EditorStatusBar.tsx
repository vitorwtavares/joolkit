import { Info } from 'lucide-react'

interface EditorStatusBarProps {
  hasUnresolved: boolean
}

export function EditorStatusBar({ hasUnresolved }: EditorStatusBarProps) {
  return (
    <div
      className="flex shrink-0 items-center px-[18px] py-2.5"
      style={{
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        background: '#1a1a18',
      }}
    >
      <div
        className={`flex items-center gap-1.5 text-xs ${hasUnresolved ? 'text-[#f09595]' : 'text-[#8a8a85]'}`}
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
