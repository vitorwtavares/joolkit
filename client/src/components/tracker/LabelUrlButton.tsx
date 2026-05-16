import { useState } from 'react'
import { Link2, ExternalLink } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { sanitizeUrl } from '@/utils/sanitizeUrl'
import { INPUT_BASE } from './styles'

interface LabelUrlButtonProps {
  url: string | null
  onSave: (url: string | null) => void
  label?: string | null
  onSaveLabel?: (label: string | null) => void
  labelTitle?: string
  urlTitle?: string
}

export function LabelUrlButton({
  url,
  onSave,
  label,
  onSaveLabel,
  labelTitle = 'Company name',
  urlTitle = 'Careers page link',
}: LabelUrlButtonProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [labelDraft, setLabelDraft] = useState('')
  const safeUrl = url ? sanitizeUrl(url) : null

  function handleOpen() {
    setDraft(url ?? '')
    setLabelDraft(label ?? '')
    setOpen(true)
  }

  function handleSave() {
    if (!draft.trim()) {
      onSave(null)
    } else {
      onSave(sanitizeUrl(draft))
    }
    if (onSaveLabel) {
      onSaveLabel(labelDraft.trim() || null)
    }
    setOpen(false)
  }

  function handleClear() {
    onSave(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleOpen}
          className={`absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer rounded p-0.5 text-link transition-all duration-150 ease-out hover:text-info ${
            url ? 'opacity-100' : 'opacity-25 hover:opacity-100'
          }`}
          aria-label={
            url
              ? `Edit ${urlTitle.toLowerCase()}`
              : `Add ${urlTitle.toLowerCase()}`
          }
        >
          <Link2
            size={16}
            className="transition-colors duration-150 ease-out"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="mb-1.5">
          <p className="mb-1 text-[12px] text-muted-foreground">{labelTitle}</p>
          <input
            name="tracker-label-name"
            autoFocus
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setOpen(false)
            }}
            maxLength={50}
            placeholder={labelTitle}
            className={`w-full ${INPUT_BASE}`}
          />
        </div>
        <div>
          <p className="mb-1 text-[12px] text-muted-foreground">{urlTitle}</p>
          <div className="flex gap-1.5">
            <input
              name="tracker-label-url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setOpen(false)
              }}
              placeholder="https://..."
              className="flex-1 rounded border border-input-border-strong bg-input-subtle px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-input-border-strong text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex gap-2">
          {url && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Remove link
            </Button>
          )}
          <Button size="sm" className="flex-1" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
