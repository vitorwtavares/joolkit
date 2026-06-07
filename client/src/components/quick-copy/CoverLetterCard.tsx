import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ExternalLink, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  COVER_LETTER_VARIATION_LIMIT,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { useExportCoverLetterPDF } from '@/api/hooks/useCoverLetters'
import { useCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'
import { useTokenState } from '@/hooks/useTokenState'
import { useDownloadBubble } from '@/hooks/useDownloadBubble'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CoverLetterVariationList } from '@/components/cover-letter/CoverLetterVariationList'
import {
  COVER_LETTER_FALLBACK_LABEL,
  getCoverLetterTemplatePath,
  getNextCoverLetterPosition,
} from '@/components/cover-letter/coverLetterVariationUtils'
import { TokenTutorialDialog } from './TokenTutorialDialog'

interface CoverLetterCardProps {
  templates: CoverLetterTemplate[]
  userId: string
  locked?: boolean
  onUploaded: (
    variation: string | null,
    path: string,
    label: string,
  ) => Promise<void> | void
  onRemoved: (variation: string) => Promise<void> | void
  onLabelUpdated: (variation: string, label: string) => Promise<void> | void
}

export function CoverLetterCard({
  templates,
  userId,
  locked = false,
  onUploaded,
  onRemoved,
  onLabelUpdated,
}: CoverLetterCardProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{
    variation: string | null
    label: string
  } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<CoverLetterTemplate | null>(null)
  const [savingLabel, setSavingLabel] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [exportingVariation, setExportingVariation] = useState<string | null>(
    null,
  )
  const {
    trigger: triggerDownload,
    bubble: downloadBubble,
    isOnCooldown,
  } = useDownloadBubble()

  const { data: tokenData } = useCoverLetterTokens()
  const exportPDF = useExportCoverLetterPDF()
  const {
    role,
    setRole,
    company,
    setCompany,
    scheduleTokenSave,
    flushTokenSave,
    flushTokenSaveAsync,
  } = useTokenState(tokenData)

  const sortedTemplates = [...templates].sort((a, b) => a.position - b.position)
  const filledCount = sortedTemplates.length
  const maxReached = filledCount >= COVER_LETTER_VARIATION_LIMIT
  const busy =
    uploading !== null ||
    removing !== null ||
    savingLabel !== null ||
    exportingVariation !== null
  async function handleOpenInEditor() {
    await flushTokenSaveAsync(role, company)
    navigate('/cover-letter')
  }

  function openUploader(
    variation: string | null,
    label = COVER_LETTER_FALLBACK_LABEL,
  ) {
    if (locked || busy) return
    uploadTargetRef.current = { variation, label }
    fileInputRef.current?.click()
  }

  function handleAdd() {
    if (!getNextCoverLetterPosition(sortedTemplates.length)) return
    openUploader(null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const target = uploadTargetRef.current
    if (!file || !target) return

    const { variation, label } = target
    const existingTemplate =
      sortedTemplates.find((template) => template.variation === variation) ??
      null
    const uploadKey = variation ?? 'new'
    const path = getCoverLetterTemplatePath(userId, variation, file.name)

    setUploading(uploadKey)

    const { error } = await supabase.storage
      .from('cover-letters')
      .upload(path, file, { upsert: true })
    if (error) {
      setUploading(null)
      toast.error('Upload failed: ' + error.message)
      e.target.value = ''
      uploadTargetRef.current = null
      return
    }

    try {
      await onUploaded(variation, path, label)
      if (existingTemplate?.file_url && existingTemplate.file_url !== path) {
        await supabase.storage
          .from('cover-letters')
          .remove([existingTemplate.file_url])
          .catch(() => {})
      }
      toast.success(`${label} uploaded`)
    } catch {
      await supabase.storage
        .from('cover-letters')
        .remove([path])
        .catch(() => {})
      setUploading(null)
    } finally {
      setUploading(null)
      e.target.value = ''
      uploadTargetRef.current = null
    }
  }

  function handleDownload(template: CoverLetterTemplate) {
    if (busy || isOnCooldown) return
    if (!role || !company) {
      toast.error(
        `Fill in ${TOKEN_ROLE} and ${TOKEN_COMPANY} before downloading`,
      )
      return
    }

    triggerDownload()
    setExportingVariation(template.variation)
    exportPDF.mutate(template.variation, {
      onSettled: () => setExportingVariation(null),
      onError: (error) => toast.error(error.message || 'Failed to export PDF'),
    })
  }

  async function handleRemove(template: CoverLetterTemplate) {
    if (locked || busy) return
    setRemoving(template.variation)
    try {
      await onRemoved(template.variation)
      if (template.file_url) {
        await supabase.storage
          .from('cover-letters')
          .remove([template.file_url])
          .catch(() => {})
      }
    } catch {
      setRemoving(null)
      return
    }
    setRemoving(null)
    setPendingDelete(null)
  }

  async function handleLabelUpdated(
    template: CoverLetterTemplate,
    label: string,
  ) {
    const nextLabel = label.trim()
    if (!nextLabel) {
      return
    }

    setSavingLabel(template.variation)
    try {
      await onLabelUpdated(template.variation, nextLabel)
    } finally {
      setSavingLabel(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex min-h-[76px] items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <FileText size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-[14px] font-semibold text-foreground">
              Cover letter
            </div>
            <div
              className={cn(
                'rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] leading-none text-muted-foreground',
                maxReached && 'border-brand-border bg-brand-soft text-brand',
              )}
            >
              {filledCount}/{COVER_LETTER_VARIATION_LIMIT}
            </div>
          </div>
          <div className="mt-0.5 text-[13px] text-text-faint">
            Up to {COVER_LETTER_VARIATION_LIMIT} variations
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <Button size="sm" onClick={handleOpenInEditor}>
            <ExternalLink size={13} />
            Open in editor
          </Button>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="cursor-pointer rounded-md px-1.5 py-0.5 text-[13px] text-text-faint transition-colors hover:bg-secondary hover:text-foreground"
          >
            How to use tokens
          </button>
        </div>
      </header>

      <div className="relative grid h-[325px] min-h-0 grid-cols-1 gap-3 p-3.5 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
        <input
          ref={fileInputRef}
          id="quick-copy-cover-letter-upload"
          name="quick-copy-cover-letter-upload"
          type="file"
          accept=".pdf"
          autoComplete="off"
          className="hidden"
          onChange={handleUpload}
        />
        {downloadBubble}

        <CoverLetterVariationList
          templates={sortedTemplates}
          locked={locked}
          busy={busy}
          uploadingVariation={uploading}
          removingVariation={removing}
          downloadingVariation={exportingVariation}
          savingLabelVariation={savingLabel}
          downloadDisabled={isOnCooldown}
          onAdd={handleAdd}
          onReplace={(template) =>
            openUploader(
              template.variation,
              template.label || COVER_LETTER_FALLBACK_LABEL,
            )
          }
          onRemove={setPendingDelete}
          onDownload={handleDownload}
          onLabelUpdated={handleLabelUpdated}
        />

        <div className="flex min-h-0 flex-col gap-2 rounded-lg border border-border bg-secondary p-3">
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

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !removing) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cover letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the uploaded file and any edited
              content saved for this cover letter. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!!removing || !pendingDelete}
              onClick={(event) => {
                event.preventDefault()
                if (pendingDelete) void handleRemove(pendingDelete)
              }}
            >
              {removing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
