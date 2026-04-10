import { useLayoutEffect, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/utils/downloadFile'
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { TruncatedLabel } from '@/components/ui/truncated-label'

interface CoverLetterCardProps {
  templates: CoverLetterTemplate[]
  userId: string
  onFileUploaded: (variation: 'formal' | 'light', path: string) => void
  onFileRemoved: (variation: 'formal' | 'light') => void
}

export function CoverLetterCard({
  templates,
  userId,
  onFileUploaded,
  onFileRemoved,
}: CoverLetterCardProps) {
  const formalInputRef = useRef<HTMLInputElement>(null)
  const lightInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<'formal' | 'light' | null>(null)

  const formal = templates.find((t) => t.variation === 'formal')
  const light = templates.find((t) => t.variation === 'light')

  useLayoutEffect(() => {
    setUploading(null)
  }, [formal?.file_url, light?.file_url])

  async function handleUpload(
    variation: 'formal' | 'light',
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const oldTemplate = variation === 'formal' ? formal : light
    const path = `${userId}/${variation}/${file.name}`

    setUploading(variation)

    if (oldTemplate?.file_url && oldTemplate.file_url !== path) {
      await supabase.storage
        .from('cover-letters')
        .remove([oldTemplate.file_url])
    }

    const { error } = await supabase.storage
      .from('cover-letters')
      .upload(path, file, { upsert: true })

    if (error) {
      setUploading(null)
      toast.error('Upload failed: ' + error.message)
      return
    }

    onFileUploaded(variation, path)
    toast.success(
      `${variation.charAt(0).toUpperCase() + variation.slice(1)} template uploaded`,
    )
    e.target.value = ''
  }

  async function handleDownload(variation: 'formal' | 'light') {
    const template = variation === 'formal' ? formal : light
    if (!template?.file_url) return

    const { data, error } = await supabase.storage
      .from('cover-letters')
      .createSignedUrl(template.file_url, 60)

    if (error || !data) {
      toast.error('Failed to get download link')
      return
    }

    const filename = template.file_url!.split('/').pop()!
    await downloadFile(data.signedUrl, filename)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/50 bg-card px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-secondary">
          <FileText size={14} className="text-muted-foreground/40" />
        </div>
        <div>
          <div className="text-[12px] text-muted-foreground">Cover letter</div>
          <div className="text-[14px] text-muted-foreground">
            Upload up to 2 templates
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {(['formal', 'light'] as const).map((v) => {
          const t = v === 'formal' ? formal : light
          const ref = v === 'formal' ? formalInputRef : lightInputRef
          const filename = t?.file_url?.split('/').pop()
          const cap = v.charAt(0).toUpperCase() + v.slice(1)
          const label = filename ? `${cap} — ${filename}` : cap

          return (
            <div key={v} className="group/slot relative">
              <input
                ref={ref}
                type="file"
                className="hidden"
                onChange={(e) => handleUpload(v, e)}
              />
              <button
                onClick={
                  t ? () => handleDownload(v) : () => ref.current?.click()
                }
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-3.5 transition-colors',
                  t
                    ? 'border-border bg-card hover:bg-secondary/30'
                    : 'border-dashed border-border/50 bg-secondary hover:bg-secondary/70',
                )}
              >
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md',
                    t ? 'bg-green-950' : 'bg-background',
                  )}
                >
                  {uploading === v ? (
                    <Loader2
                      size={13}
                      className="animate-spin text-muted-foreground/40"
                    />
                  ) : t ? (
                    <FileText size={13} className="text-green-400" />
                  ) : (
                    <Upload size={13} className="text-muted-foreground/40" />
                  )}
                </div>
                <TruncatedLabel
                  text={label}
                  className="text-[12px] font-medium text-muted-foreground"
                />
                <span className="text-[12px] text-muted-foreground/40">
                  {t ? 'Click to download' : 'Click to upload'}
                </span>
              </button>
              {t && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileRemoved(v)
                  }}
                  className="absolute -top-[11px] -right-[11px] z-10 flex size-[24px] cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary"
                >
                  <Trash2 size={13} className="text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
