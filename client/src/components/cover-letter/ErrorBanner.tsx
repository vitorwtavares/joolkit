import { Info } from 'lucide-react'

interface ErrorBannerProps {
  unresolvedTokens: string[]
}

export function ErrorBanner({ unresolvedTokens }: ErrorBannerProps) {
  if (unresolvedTokens.length === 0) return null

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-danger-border-soft bg-danger-soft-strong px-3.5 py-2.5">
      <Info className="mt-px size-[15px] shrink-0 text-danger" />
      <div className="text-xs leading-relaxed text-danger">
        <strong className="mb-0.5 block font-medium">
          Unresolved tokens detected
        </strong>
        Fill in{' '}
        {unresolvedTokens.map((token, i) => (
          <span key={token}>
            {i > 0 && ' and '}
            <code className="font-mono text-[11px]">{token}</code>
          </span>
        ))}{' '}
        in the side panel to enable download.
      </div>
    </div>
  )
}
