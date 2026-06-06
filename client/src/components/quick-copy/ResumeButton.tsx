import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import {
  RESUME_VARIATION_LIMIT,
  type ResumeVariation,
} from '@/api/hooks/useResumes'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/utils/downloadFile'
import { useDownloadBubble } from '@/hooks/useDownloadBubble'
import { PersistentScrollArea } from '@/components/ui/persistent-scroll-area'

interface ResumeButtonProps {
  resumes: ResumeVariation[]
  userId: string
  locked?: boolean
  onUploaded: (
    resumeId: string | null,
    path: string,
    label: string,
  ) => Promise<void> | void
  onRemoved: (resumeId: string) => Promise<void> | void
  onLabelUpdated: (resumeId: string, label: string) => Promise<void> | void
}

function getFilename(path: string): string {
  return path.split('/').pop() ?? path
}

function getFallbackLabel(): string {
  return 'Resume'
}

function getNextPosition(resumes: ResumeVariation[]): number | null {
  const nextPosition = resumes.length + 1
  return nextPosition <= RESUME_VARIATION_LIMIT ? nextPosition : null
}

export function ResumeButton({
  resumes,
  userId,
  locked = false,
  onUploaded,
  onRemoved,
  onLabelUpdated,
}: ResumeButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{
    id: string | null
    position: number
    label: string
  } | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const [editingPosition, setEditingPosition] = useState<number | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [savingLabel, setSavingLabel] = useState<number | null>(null)
  const [iconPop, setIconPop] = useState<number | null>(null)
  const {
    trigger: triggerDownload,
    bubble: downloadBubble,
    isOnCooldown,
  } = useDownloadBubble()

  const sortedResumes = [...resumes].sort((a, b) => a.position - b.position)
  const filledCount = sortedResumes.length
  const maxReached = filledCount >= RESUME_VARIATION_LIMIT
  const busy = uploading !== null || removing !== null || savingLabel !== null
  const addingNewVariation =
    uploading !== null &&
    !sortedResumes.some((resume) => resume.position === uploading)

  useEffect(() => {
    if (editingPosition === null) return
    const input = labelInputRef.current
    input?.focus()
    const cursorPosition = input?.value.length ?? 0
    input?.setSelectionRange(cursorPosition, cursorPosition)
  }, [editingPosition])

  function openUploader(
    position: number,
    label = getFallbackLabel(),
    id: string | null = null,
  ) {
    if (locked || busy) return
    uploadTargetRef.current = { id, position, label }
    fileInputRef.current?.click()
  }

  function handleAdd() {
    const position = getNextPosition(sortedResumes)
    if (!position) return
    openUploader(position)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const target = uploadTargetRef.current
    if (!file || !target) return

    const { id, position, label } = target
    const existingResume =
      sortedResumes.find((resume) => resume.id === id) ?? null
    const path = `${userId}/${crypto.randomUUID()}/${file.name}`

    setUploading(position)

    const { error } = await supabase.storage
      .from('resumes')
      .upload(path, file, { upsert: true })
    if (error) {
      setUploading(null)
      toast.error('Upload failed: ' + error.message)
      e.target.value = ''
      uploadTargetRef.current = null
      return
    }

    try {
      await onUploaded(id, path, label)
      // Only once the DB points at the new file is it safe to drop the old one;
      // a best-effort removal failure just orphans a file, never breaks the row.
      if (existingResume?.file_url && existingResume.file_url !== path) {
        await supabase.storage
          .from('resumes')
          .remove([existingResume.file_url])
          .catch(() => {})
      }
      setIconPop(position)
      toast.success(`${label} uploaded`)
    } catch {
      // The DB never recorded this file, so remove it instead of orphaning it.
      await supabase.storage
        .from('resumes')
        .remove([path])
        .catch(() => {})
      setUploading(null)
    } finally {
      setUploading(null)
      e.target.value = ''
      uploadTargetRef.current = null
    }
  }

  async function handleDownload(resume: ResumeVariation) {
    if (busy || isOnCooldown) return
    triggerDownload()
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_url, 60)
    if (error || !data) {
      toast.error('Failed to get download link')
      return
    }
    await downloadFile(data.signedUrl, getFilename(resume.file_url))
  }

  async function handleRemove(resume: ResumeVariation) {
    if (locked || busy) return
    setRemoving(resume.position)
    try {
      await onRemoved(resume.id)
      // The row is gone from the DB; a failed storage delete only orphans a
      // file, so keep it best-effort and don't surface it as a removal failure.
      await supabase.storage
        .from('resumes')
        .remove([resume.file_url])
        .catch(() => {})
    } catch {
      setRemoving(null)
      return
    }
    setRemoving(null)
  }

  function startLabelEdit(resume: ResumeVariation) {
    if (locked || busy) return
    setEditingPosition(resume.position)
    setLabelDraft(resume.label || getFallbackLabel())
  }

  function cancelLabelEdit() {
    setEditingPosition(null)
    setLabelDraft('')
  }

  async function saveLabel(resume: ResumeVariation) {
    const nextLabel = labelDraft.trim()
    if (!nextLabel) {
      cancelLabelEdit()
      return
    }

    setSavingLabel(resume.position)
    try {
      await onLabelUpdated(resume.id, nextLabel)
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
              Resume
            </div>
            <div
              className={cn(
                'rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10.5px] leading-none text-muted-foreground',
                maxReached && 'border-brand-border bg-brand-soft text-brand',
              )}
            >
              {filledCount}/{RESUME_VARIATION_LIMIT}
            </div>
          </div>
          <div className="mt-0.5 text-[12px] text-text-faint">
            Up to {RESUME_VARIATION_LIMIT} variations
          </div>
        </div>
      </header>

      <div className="relative flex h-[325px] min-h-0 flex-col p-3.5">
        <input
          ref={fileInputRef}
          id="quick-copy-resume-upload"
          name="quick-copy-resume-upload"
          type="file"
          accept=".pdf"
          autoComplete="off"
          className="hidden"
          onChange={handleUpload}
        />
        {downloadBubble}

        {sortedResumes.length === 0 ? (
          <button
            type="button"
            disabled={locked || busy}
            onClick={handleAdd}
            className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-secondary px-4 py-6 text-center transition-colors hover:border-brand-border hover:bg-surface-selected disabled:pointer-events-none disabled:opacity-60"
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
            <span className="max-w-[26ch] text-[11.5px] text-text-faint">
              Add up to {RESUME_VARIATION_LIMIT} variations. Each becomes a
              one-click download.
            </span>
          </button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <PersistentScrollArea
              className="flex min-h-0 flex-1"
              viewportClassName="flex min-h-0 flex-1"
              contentClassName="flex min-h-0 flex-1 flex-col gap-2"
            >
              {sortedResumes.map((resume) => {
                const label = resume.label || getFallbackLabel()
                const filename = getFilename(resume.file_url)
                const rowUploading = uploading === resume.position
                const rowRemoving = removing === resume.position
                const rowSavingLabel = savingLabel === resume.position
                const rowEditing = editingPosition === resume.position
                const rowBusy = rowUploading || rowRemoving || rowSavingLabel

                return (
                  <div
                    key={resume.id}
                    className={cn(
                      'group/resume-row relative grid h-[62px] min-h-0 w-full shrink-0 grid-cols-[34px_1fr_auto] content-center items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-[background-color,border-color] hover:border-brand hover:bg-surface-selected',
                      (rowBusy || busy) && 'opacity-70',
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`Download ${filename}`}
                      title={`Download ${filename}`}
                      disabled={busy || isOnCooldown || rowEditing}
                      onClick={() => void handleDownload(resume)}
                      className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-border disabled:cursor-default"
                    />
                    <span
                      className={cn(
                        'pointer-events-none relative z-10 flex size-[34px] items-center justify-center rounded-lg bg-brand-soft text-brand',
                        iconPop === resume.position && 'animate-icon-pop',
                      )}
                      onAnimationEnd={() => {
                        if (iconPop === resume.position) setIconPop(null)
                      }}
                    >
                      {rowUploading || rowRemoving ? (
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
                                void saveLabel(resume)
                              }
                              if (event.key === 'Escape') {
                                cancelLabelEdit()
                              }
                            }}
                            className="h-7 min-w-0 flex-1 rounded-[5px] border border-brand-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-brand-border/50"
                          />
                          <button
                            type="button"
                            aria-label="Save resume label"
                            disabled={rowSavingLabel}
                            onClick={() => void saveLabel(resume)}
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
                            aria-label="Cancel resume label edit"
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
                              onClick={() => startLabelEdit(resume)}
                              className="pointer-events-auto flex size-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Pencil size={11} strokeWidth={2.4} />
                            </button>
                          )}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[11.5px] text-text-faint">
                        {filename}
                      </span>
                    </span>
                    <span className="pointer-events-none relative z-10 flex items-center gap-1">
                      <span className="flex size-[30px] items-center justify-center rounded-md text-text-faint transition-colors group-hover/resume-row:bg-brand-soft group-hover/resume-row:text-brand">
                        <Download size={15} />
                      </span>
                      <button
                        type="button"
                        aria-label={`Replace ${label}`}
                        title="Replace file"
                        disabled={locked || busy}
                        onClick={() =>
                          openUploader(resume.position, label, resume.id)
                        }
                        className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                      >
                        <RefreshCcw size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        title="Remove"
                        disabled={locked || busy}
                        onClick={() => void handleRemove(resume)}
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
                  Maximum of {RESUME_VARIATION_LIMIT} variations reached
                </div>
              ) : (
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={handleAdd}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-60"
                >
                  {addingNewVariation ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={14} />
                      Add variation
                      <span className="font-normal text-text-faint">
                        · {filledCount}/{RESUME_VARIATION_LIMIT}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
