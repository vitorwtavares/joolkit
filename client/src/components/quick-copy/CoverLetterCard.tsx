import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
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
import { PersistentScrollArea } from '@/components/ui/persistent-scroll-area'
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

function getFilename(path: string | null): string {
  if (!path) return 'cover-letter.pdf'
  return path.split('/').pop() ?? path
}

function getFallbackLabel(): string {
  return 'Cover letter'
}

function getNextPosition(templates: CoverLetterTemplate[]): number | null {
  const nextPosition = templates.length + 1
  return nextPosition <= COVER_LETTER_VARIATION_LIMIT ? nextPosition : null
}

function getTemplatePath(
  userId: string,
  variation: string | null,
  fileName: string,
): string {
  const folder = variation ?? crypto.randomUUID()
  return `${userId}/${folder}/${crypto.randomUUID()}/${fileName}`
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
  const labelInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{
    variation: string | null
    label: string
  } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<CoverLetterTemplate | null>(null)
  const [editingVariation, setEditingVariation] = useState<string | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
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
  const addingNewVariation =
    uploading !== null &&
    !sortedTemplates.some((template) => template.variation === uploading)

  useEffect(() => {
    if (editingVariation === null) return
    const input = labelInputRef.current
    input?.focus()
    const cursorPosition = input?.value.length ?? 0
    input?.setSelectionRange(cursorPosition, cursorPosition)
  }, [editingVariation])

  async function handleOpenInEditor() {
    await flushTokenSaveAsync(role, company)
    navigate('/cover-letter')
  }

  function openUploader(variation: string | null, label = getFallbackLabel()) {
    if (locked || busy) return
    uploadTargetRef.current = { variation, label }
    fileInputRef.current?.click()
  }

  function handleAdd() {
    if (!getNextPosition(sortedTemplates)) return
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
    const path = getTemplatePath(userId, variation, file.name)

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
      onError: () => toast.error('Failed to export PDF'),
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

  function startLabelEdit(template: CoverLetterTemplate) {
    if (locked || busy) return
    setEditingVariation(template.variation)
    setLabelDraft(template.label || getFallbackLabel())
  }

  function cancelLabelEdit() {
    setEditingVariation(null)
    setLabelDraft('')
  }

  async function saveLabel(template: CoverLetterTemplate) {
    const nextLabel = labelDraft.trim()
    if (!nextLabel) {
      cancelLabelEdit()
      return
    }

    setSavingLabel(template.variation)
    try {
      await onLabelUpdated(template.variation, nextLabel)
      cancelLabelEdit()
    } catch {
      // Parent shows the toast; keep the editor open for correction/retry.
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

        {sortedTemplates.length === 0 ? (
          <button
            type="button"
            disabled={locked || busy}
            onClick={handleAdd}
            className="flex h-full min-h-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-secondary px-4 py-6 text-center transition-colors hover:border-brand-border hover:bg-surface-selected disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface-selected text-text-faint">
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={20} />
              )}
            </span>
            <span className="text-[13px] font-semibold text-foreground">
              Upload a file
            </span>
            <span className="max-w-[28ch] text-[12px] text-text-faint">
              Add up to {COVER_LETTER_VARIATION_LIMIT} variations. Each becomes
              a one-click download.
            </span>
          </button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <PersistentScrollArea
              className="flex min-h-0 flex-1"
              viewportClassName="flex min-h-0 flex-1"
              contentClassName="flex min-h-0 flex-1 flex-col gap-2"
            >
              {sortedTemplates.map((template) => {
                const label = template.label || getFallbackLabel()
                const filename = getFilename(template.file_url)
                const rowUploading = uploading === template.variation
                const rowRemoving = removing === template.variation
                const rowSavingLabel = savingLabel === template.variation
                const rowExporting = exportingVariation === template.variation
                const rowEditing = editingVariation === template.variation
                const rowBusy =
                  rowUploading || rowRemoving || rowSavingLabel || rowExporting

                return (
                  <div
                    key={template.id}
                    className={cn(
                      'group/cover-row relative grid h-[62px] min-h-0 w-full shrink-0 grid-cols-[34px_1fr_auto] content-center items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-[background-color,border-color] hover:border-brand hover:bg-surface-selected',
                      (rowBusy || busy) && 'opacity-70',
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`Download ${filename}`}
                      title={`Download ${filename}`}
                      disabled={busy || isOnCooldown || rowEditing}
                      onClick={() => handleDownload(template)}
                      className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-border disabled:cursor-default"
                    />
                    <span className="pointer-events-none relative z-10 flex size-[34px] items-center justify-center rounded-lg bg-brand-soft text-brand">
                      {rowUploading || rowRemoving || rowExporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                    </span>
                    <span className="pointer-events-none relative z-10 min-w-0">
                      {rowEditing ? (
                        <span className="pointer-events-auto flex h-7 max-w-[275px] min-w-0 items-center gap-1.5">
                          <input
                            ref={labelInputRef}
                            value={labelDraft}
                            autoComplete="off"
                            aria-label={`Rename ${label}`}
                            onChange={(event) =>
                              setLabelDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                void saveLabel(template)
                              }
                              if (event.key === 'Escape') {
                                cancelLabelEdit()
                              }
                            }}
                            className="h-7 min-w-0 flex-1 rounded-[5px] border border-brand-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-brand-border/50"
                          />
                          <button
                            type="button"
                            aria-label="Save cover letter label"
                            disabled={rowSavingLabel}
                            onClick={() => void saveLabel(template)}
                            className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-success-soft-strong text-success transition-colors hover:bg-success/25 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {rowSavingLabel ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel cover letter label edit"
                            disabled={rowSavingLabel}
                            onClick={cancelLabelEdit}
                            className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-danger-soft-fill text-danger transition-colors hover:bg-danger/25 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ) : (
                        <span className="flex h-7 min-w-0 items-center gap-1">
                          <span className="block truncate text-[13px] font-semibold text-foreground">
                            {label}
                          </span>
                          {!locked && (
                            <button
                              type="button"
                              aria-label={`Edit ${label} label`}
                              title="Edit label"
                              disabled={busy}
                              onClick={() => startLabelEdit(template)}
                              className="pointer-events-auto flex size-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Pencil size={11} strokeWidth={2.4} />
                            </button>
                          )}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[12px] text-text-faint">
                        {filename}
                      </span>
                    </span>
                    <span className="pointer-events-none relative z-10 flex items-center gap-1">
                      <span className="flex size-[30px] items-center justify-center rounded-md text-text-faint transition-colors group-hover/cover-row:bg-brand-soft group-hover/cover-row:text-brand">
                        <Download size={15} />
                      </span>
                      <button
                        type="button"
                        aria-label={`Replace ${label}`}
                        title="Replace file"
                        disabled={locked || busy}
                        onClick={() => openUploader(template.variation, label)}
                        className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                      >
                        <RefreshCcw size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        title="Remove"
                        disabled={locked || busy}
                        onClick={() => setPendingDelete(template)}
                        className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-danger-soft-fill hover:text-danger disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                )
              })}
            </PersistentScrollArea>
            <div className="flex-shrink-0 pt-2">
              {maxReached ? (
                <div className="px-2 py-1 text-center text-[11px] text-text-faint">
                  Maximum of {COVER_LETTER_VARIATION_LIMIT} variations reached
                </div>
              ) : (
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={handleAdd}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-60"
                >
                  {addingNewVariation ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={14} />
                      Add variation
                      <span className="font-normal text-text-faint">
                        · {filledCount}/{COVER_LETTER_VARIATION_LIMIT}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

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
