import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, Loader2, Trash2, Upload, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { useExportCoverLetterPDF } from '@/api/hooks/useCoverLetters'
import { useCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'
import { useTokenState } from '@/hooks/useTokenState'
import { useDownloadBubble } from '@/hooks/useDownloadBubble'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'
import { TruncatedLabel } from '@/components/ui/truncated-label'
import { TokenTutorialDialog } from './TokenTutorialDialog'

interface CoverLetterCardProps {
  templates: CoverLetterTemplate[]
  userId: string
  onFileUploaded: (variation: 'formal' | 'light', path: string) => void
  onFileRemoved: (variation: 'formal' | 'light') => Promise<void>
}

export function CoverLetterCard({
  templates,
  userId,
  onFileUploaded,
  onFileRemoved,
}: CoverLetterCardProps) {
  const navigate = useNavigate()
  const formalInputRef = useRef<HTMLInputElement>(null)
  const lightInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<'formal' | 'light' | null>(null)
  const [removing, setRemoving] = useState<'formal' | 'light' | null>(null)
  const [iconPop, setIconPop] = useState<'formal' | 'light' | null>(null)
  const [fallingSlot, setFallingSlot] = useState<'formal' | 'light' | null>(
    null,
  )
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [exportingVariation, setExportingVariation] = useState<
    'formal' | 'light' | null
  >(null)
  const prevUploadingRef = useRef<'formal' | 'light' | null>(null)

  const { data: tokenData } = useCoverLetterTokens()
  const exportPDF = useExportCoverLetterPDF()
  const {
    trigger: triggerFormalDownload,
    bubble: formalDownloadBubble,
    isOnCooldown: formalOnCooldown,
  } = useDownloadBubble()
  const {
    trigger: triggerLightDownload,
    bubble: lightDownloadBubble,
    isOnCooldown: lightOnCooldown,
  } = useDownloadBubble()
  const {
    role,
    setRole,
    company,
    setCompany,
    scheduleTokenSave,
    flushTokenSave,
    flushTokenSaveAsync,
  } = useTokenState(tokenData)

  async function handleOpenInEditor() {
    await flushTokenSaveAsync(role, company)
    navigate('/cover-letter')
  }

  const formal = templates.find((t) => t.variation === 'formal')
  const light = templates.find((t) => t.variation === 'light')

  useLayoutEffect(() => {
    const wasUploading = prevUploadingRef.current
    prevUploadingRef.current = uploading
    if (!uploading && wasUploading) {
      const uploaded =
        wasUploading === 'formal' ? formal?.file_url : light?.file_url
      if (uploaded) setIconPop(wasUploading)
    }
  }, [uploading])

  useLayoutEffect(() => {
    if (removing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (removing === 'formal' && !formal?.file_url) setFallingSlot('formal')
      if (removing === 'light' && !light?.file_url) setFallingSlot('light')
      setRemoving(null)
    }
    if (uploading) setUploading(null)
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
        .catch(() => {})
    }

    const { error } = await supabase.storage
      .from('cover-letters')
      .upload(path, file, { upsert: true })

    if (error) {
      setUploading(null)
      toast.error('Upload failed: ' + error.message)
      e.target.value = ''
      return
    }

    onFileUploaded(variation, path)
    toast.success(
      `${variation.charAt(0).toUpperCase() + variation.slice(1)} template uploaded`,
    )
    e.target.value = ''
  }

  function handleDownload(variation: 'formal' | 'light') {
    if (!role || !company) {
      toast.error(
        `Fill in ${TOKEN_ROLE} and ${TOKEN_COMPANY} before downloading`,
      )
      return
    }
    const triggerDownload =
      variation === 'formal' ? triggerFormalDownload : triggerLightDownload
    triggerDownload()
    setExportingVariation(variation)
    exportPDF.mutate(variation, {
      onSettled: () => setExportingVariation(null),
      onError: () => toast.error('Failed to export PDF'),
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/50 bg-secondary px-4 py-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 max-[1200px]:flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-secondary">
            <FileText size={14} className="text-muted-foreground/40" />
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground">
              Cover letter
            </div>
            <div className="text-[14px] text-muted-foreground">
              Upload up to 2 templates
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 max-[1200px]:mb-3 max-[1200px]:ml-auto max-[1200px]:flex-col max-[1200px]:items-end max-[1200px]:gap-2">
          <button
            onClick={() => setTutorialOpen(true)}
            className="cursor-pointer text-[13px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground max-[1200px]:order-2 max-[1200px]:text-right"
          >
            How to use tokens
          </button>

          <button
            onClick={handleOpenInEditor}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-opacity hover:opacity-90 max-[1200px]:order-1"
            style={{
              background: 'color-mix(in srgb, var(--brand) 72%, black)',
              color: 'var(--brand-foreground)',
            }}
          >
            <ExternalLink size={13} />
            Open in editor
          </button>
        </div>
      </div>

      {/* Body: slots (original grid) + tokens panel */}
      <div className="flex gap-8 max-[1200px]:flex-wrap">
        {/* Slots: original 2-column grid, grows to fill space */}
        <div className="grid min-w-0 flex-[65] grid-cols-2 items-stretch gap-8 max-[1200px]:w-full max-[1200px]:flex-none">
          {(['formal', 'light'] as const).map((v) => {
            const t = v === 'formal' ? formal : light
            const ref = v === 'formal' ? formalInputRef : lightInputRef
            const filename = t?.file_url?.split('/').pop()
            const cap = v.charAt(0).toUpperCase() + v.slice(1)
            const label = filename ? `${cap} — ${filename}` : cap
            const showAsFilled = !!t || fallingSlot === v
            const isExporting = exportingVariation === v
            const downloadBubble =
              v === 'formal' ? formalDownloadBubble : lightDownloadBubble
            const onCooldown =
              v === 'formal' ? formalOnCooldown : lightOnCooldown

            return (
              <div key={v} className="group/slot relative h-full">
                <input
                  ref={ref}
                  type="file"
                  accept=".pdf"
                  autoComplete="off"
                  className="hidden"
                  onChange={(e) => handleUpload(v, e)}
                />
                {downloadBubble}
                <button
                  disabled={
                    uploading === v ||
                    removing === v ||
                    fallingSlot === v ||
                    isExporting ||
                    onCooldown
                  }
                  onClick={
                    t ? () => handleDownload(v) : () => ref.current?.click()
                  }
                  className={cn(
                    'flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-5 transition-colors disabled:pointer-events-none',
                    showAsFilled
                      ? 'border-border bg-secondary hover:bg-card'
                      : 'border-dashed border-border/50 bg-surface-selected hover:bg-surface-selected-hover',
                  )}
                >
                  {removing === v && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-popover/90">
                      <Loader2
                        size={16}
                        className="animate-spin text-muted-foreground"
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md',
                      fallingSlot === v
                        ? undefined
                        : showAsFilled
                          ? 'bg-success-soft'
                          : 'bg-background',
                      iconPop === v && 'animate-icon-pop',
                      fallingSlot === v && 'animate-icon-fall',
                    )}
                    onAnimationEnd={() => {
                      if (iconPop === v) setIconPop(null)
                      if (fallingSlot === v) setFallingSlot(null)
                    }}
                  >
                    {uploading === v || isExporting ? (
                      <Loader2
                        size={13}
                        className="animate-spin text-muted-foreground/40"
                      />
                    ) : showAsFilled ? (
                      <FileText
                        size={13}
                        className={
                          fallingSlot === v ? undefined : 'text-success'
                        }
                      />
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
                    disabled={removing === v || fallingSlot === v}
                    onClick={async (e) => {
                      e.stopPropagation()
                      setRemoving(v)
                      try {
                        await onFileRemoved(v)
                      } catch {
                        setRemoving(null)
                      }
                    }}
                    className="absolute -top-[11px] -right-[11px] z-10 flex size-[24px] cursor-pointer items-center justify-center rounded-full border border-border bg-secondary shadow-sm transition-colors hover:bg-surface-selected disabled:pointer-events-none"
                  >
                    {removing === v ? (
                      <Loader2
                        size={13}
                        className="animate-spin text-muted-foreground"
                      />
                    ) : (
                      <Trash2 size={13} className="text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Tokens panel */}
        <div className="flex min-w-0 flex-[35] flex-col gap-2 rounded-md border border-border bg-secondary p-3 max-[1200px]:w-full max-[1200px]:flex-none">
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[13px] text-muted-foreground">
              {TOKEN_ROLE}
            </div>
            <input
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                scheduleTokenSave(e.target.value, company)
              }}
              onBlur={() => flushTokenSave(role, company)}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-md border border-border bg-background px-2.5 py-[6px] font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[13px] text-muted-foreground">
              {TOKEN_COMPANY}
            </div>
            <input
              value={company}
              onChange={(e) => {
                setCompany(e.target.value)
                scheduleTokenSave(role, e.target.value)
              }}
              onBlur={() => flushTokenSave(role, company)}
              placeholder="e.g. Xiaomi"
              className="w-full rounded-md border border-border bg-background px-2.5 py-[6px] font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      <TokenTutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  )
}
