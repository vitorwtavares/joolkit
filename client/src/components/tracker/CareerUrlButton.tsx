import { useState } from 'react'
import { Link2, ExternalLink } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { sanitizeUrl } from '@/utils/sanitizeUrl'

interface CareerUrlButtonProps {
  url: string | null
  onSave: (url: string | null) => void
}

export function CareerUrlButton({ url, onSave }: CareerUrlButtonProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const safeUrl = url ? sanitizeUrl(url) : null

  function handleOpen() {
    setDraft(url ?? '')
    setOpen(true)
  }

  function handleSave() {
    if (!draft.trim()) {
      onSave(null)
    } else {
      onSave(sanitizeUrl(draft))
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
          className={`absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer rounded p-0.5 transition-all ${
            url ? '' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'
          }`}
          aria-label={url ? 'Edit job link' : 'Add job link'}
        >
          <Link2 size={16} className="text-[#4a9eff]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="https://..."
            className="flex-1 rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-[rgba(255,255,255,0.1)] text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          )}
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
