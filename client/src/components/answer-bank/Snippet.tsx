import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SnippetVariant = 'default' | 'detailed'

const LABELS: Record<SnippetVariant, string> = {
  default: 'Default',
  detailed: 'Detailed',
}

interface SnippetProps {
  variant: SnippetVariant
  text: string | null | undefined
}

export function Snippet({ variant, text }: SnippetProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  if (!text?.trim()) {
    return (
      <div className="flex h-[96px] w-full flex-col rounded-lg border border-dashed border-border-subtle px-[11px] py-2.5">
        <div className="mb-1 flex items-center">
          <span className="text-[11px] font-medium tracking-[0.05em] text-text-faint uppercase">
            {LABELS[variant]}
          </span>
        </div>
        <p className="text-[13px] text-text-faint italic">
          Add a {variant === 'default' ? 'short' : 'longer'} take…
        </p>
      </div>
    )
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1200)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${LABELS[variant]} answer`}
      className={cn(
        'group/snippet relative flex h-[96px] w-full cursor-pointer flex-col overflow-hidden rounded-lg border px-[11px] py-2.5 text-left transition-[border-color,background-color]',
        copied
          ? 'border-[rgba(95,191,129,0.42)] bg-[rgba(95,191,129,0.08)]'
          : 'border-border-subtle bg-white/[0.015] hover:border-border hover:bg-secondary',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tracking-[0.05em] text-text-faint uppercase">
          {LABELS[variant]}
        </span>
        <span
          aria-hidden
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium transition-opacity',
            copied
              ? 'text-[#a6d9b4] opacity-100'
              : 'text-muted-foreground opacity-0 group-hover/snippet:opacity-100',
          )}
        >
          {copied ? (
            <>
              <Check size={11} /> Copied
            </>
          ) : (
            <>
              <Copy size={11} /> Copy
            </>
          )}
        </span>
      </div>
      <p className="line-clamp-3 text-[13px] leading-snug text-muted-foreground">
        {text}
      </p>
    </button>
  )
}
