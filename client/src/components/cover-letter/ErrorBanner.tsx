import { Info } from 'lucide-react'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'

interface ErrorBannerProps {
  role: string
  company: string
}

export function ErrorBanner({ role, company }: ErrorBannerProps) {
  const missing: string[] = []
  if (!role) missing.push(TOKEN_ROLE)
  if (!company) missing.push(TOKEN_COMPANY)

  if (missing.length === 0) return null

  return (
    <div className="mx-auto mb-5 flex max-w-[620px] items-start gap-2.5 rounded-lg border border-[rgba(220,80,80,0.30)] bg-[rgba(220,80,80,0.08)] px-3.5 py-2.5">
      <Info className="mt-px size-[15px] shrink-0 text-[#f09595]" />
      <div className="text-xs leading-relaxed text-[#f09595]">
        <strong className="mb-0.5 block font-medium">
          Unresolved tokens detected
        </strong>
        Fill in{' '}
        {missing.map((token, i) => (
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
