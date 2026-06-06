import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, Loader2, Trash2, Upload, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  }, [uploading, formal?.file_url, light?.file_url])

  // This effect intentionally waits for the parent's file_url to change before
  // clearing the local removing/uploading flags. Including them as deps would
  // re-fire on setRemoving(...) and immediately clear it, killing the spinner
  // mid-action.
  useLayoutEffect(() => {
    if (removing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (removing === 'formal' && !formal?.file_url) setFallingSlot('formal')
      if (removing === 'light' && !light?.file_url) setFallingSlot('light')
      setRemoving(null)
    }
    if (uploading) setUploading(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <header className="flex min-h-[80px] items-center gap-3 border-b border-border px-4">
        <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-secondary">
          <FileText size={14} className="text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-foreground">
            Cover letter
          </div>
          <div className="text-[13px] whitespace-nowrap text-text-faint">
            Upload up to 2 templates
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <Button size="sm" onClick={handleOpenInEditor}>
            <ExternalLink size={13} />
            Open in editor
          </Button>
          <button
            onClick={() => setTutorialOpen(true)}
            className="cursor-pointer rounded-md px-1.5 py-0.5 text-[13px] text-text-faint transition-colors hover:bg-secondary hover:text-foreground"
          >
            How to use tokens
          </button>
        </div>
      </header>

      {/* Body: slots + tokens panel */}
      <div className="flex flex-wrap gap-3 p-3.5">
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
          const onCooldown = v === 'formal' ? formalOnCooldown : lightOnCooldown

          return (
            <div
              key={v}
              className="group/slot relative min-w-[180px] flex-[1_1_180px]"
            >
              <input
                ref={ref}
                id={`quick-copy-cover-letter-${v}-upload`}
                name={`quick-copy-cover-letter-${v}-upload`}
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
                  'flex h-full min-h-[132px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-5 transition-colors disabled:pointer-events-none',
                  showAsFilled
                    ? 'border-border bg-secondary hover:border-brand hover:bg-surface-selected'
                    : 'border-dashed border-border-strong bg-secondary hover:border-brand hover:bg-surface-selected',
                )}
              >
                {removing === v && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-popover/90">
                    <Loader2
                      size={16}
                      className="animate-spin text-muted-foreground"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    'mb-1 flex size-[42px] items-center justify-center rounded-lg',
                    fallingSlot === v
                      ? undefined
                      : showAsFilled
                        ? 'bg-brand-soft text-brand'
                        : 'bg-card text-text-faint',
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
                      size={18}
                      className="animate-spin text-text-faint"
                    />
                  ) : showAsFilled ? (
                    <FileText size={20} />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <TruncatedLabel
                  text={label}
                  className="text-[12.5px] font-medium text-foreground"
                />
                <span className="text-[12px] text-text-faint">
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
                  aria-label={`Remove ${cap} template`}
                  className="absolute top-2 right-2 z-10 flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground opacity-0 transition-[opacity,background-color,color] group-hover/slot:opacity-100 hover:bg-danger-soft-fill hover:text-danger disabled:pointer-events-none"
                >
                  {removing === v ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              )}
            </div>
          )
        })}

        {/* Tokens panel */}
        <div className="flex min-w-[240px] flex-[1.5_1_240px] flex-col gap-2 rounded-lg border border-border bg-secondary p-3">
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[13px] text-brand">{TOKEN_ROLE}</div>
            <input
              id="quick-copy-cover-letter-role"
              name="quick-copy-cover-letter-role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                scheduleTokenSave(e.target.value, company)
              }}
              onBlur={() => flushTokenSave(role, company)}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-md border border-border bg-background px-2.5 py-[6px] font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-brand-border"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[13px] text-brand">
              {TOKEN_COMPANY}
            </div>
            <input
              id="quick-copy-cover-letter-company"
              name="quick-copy-cover-letter-company"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value)
                scheduleTokenSave(role, e.target.value)
              }}
              onBlur={() => flushTokenSave(role, company)}
              placeholder="e.g. Xiaomi"
              className="w-full rounded-md border border-border bg-background px-2.5 py-[6px] font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-brand-border"
            />
          </div>
        </div>
      </div>

      <TokenTutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  )
}
