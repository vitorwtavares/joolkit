import { useLayoutEffect, useRef, useState } from 'react'
import { FileText, Loader2, Plus, Upload } from 'lucide-react'
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
import { ResumeRow } from './ResumeRow'

function getFilename(path: string): string {
  return path.split('/').pop() ?? path
}

function getNextPosition(resumes: ResumeVariation[]): number | null {
  const nextPosition = resumes.length + 1
  return nextPosition <= RESUME_VARIATION_LIMIT ? nextPosition : null
}

interface ResumeCardProps {
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

export function ResumeCard({
  resumes,
  userId,
  locked = false,
  onUploaded,
  onRemoved,
  onLabelUpdated,
}: ResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const uploadTargetRef = useRef<{
    id: string | null
    position: number
    label: string
  } | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const [iconPop, setIconPop] = useState<number | null>(null)
  const {
    trigger: triggerDownload,
    bubble: downloadBubble,
    isOnCooldown,
  } = useDownloadBubble()

  const sortedResumes = [...resumes].sort((a, b) => a.position - b.position)
  const filledCount = sortedResumes.length
  const maxReached = filledCount >= RESUME_VARIATION_LIMIT
  const busy = uploading !== null || removing !== null
  const addingNewVariation =
    uploading !== null &&
    !sortedResumes.some((resume) => resume.position === uploading)

  const prevResumeCountRef = useRef(sortedResumes.length)
  const hasSettledRef = useRef(false)

  useLayoutEffect(() => {
    const prevCount = prevResumeCountRef.current
    prevResumeCountRef.current = sortedResumes.length

    if (!hasSettledRef.current) {
      if (sortedResumes.length > 0) hasSettledRef.current = true
      return
    }

    if (sortedResumes.length > prevCount) {
      const viewport = scrollViewportRef.current
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight - viewport.clientHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [sortedResumes])

  function openUploader(
    position: number,
    label = 'Resume',
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
                'rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] leading-none text-muted-foreground',
                maxReached && 'border-brand-border bg-brand-soft text-brand',
              )}
            >
              {filledCount}/{RESUME_VARIATION_LIMIT}
            </div>
          </div>
          <div className="mt-0.5 text-[13px] text-text-faint">
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
            <span className="max-w-[26ch] text-[12px] text-text-faint">
              Add up to {RESUME_VARIATION_LIMIT} variations. Each becomes a
              one-click download.
            </span>
          </button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <PersistentScrollArea
              scrollViewportRef={scrollViewportRef}
              className="flex min-h-0 flex-1"
              viewportClassName="flex min-h-0 flex-1"
              contentClassName="flex min-h-0 flex-1 flex-col gap-2"
              fadeEdges
            >
              {sortedResumes.map((resume) => (
                <ResumeRow
                  key={resume.id}
                  resume={resume}
                  locked={locked}
                  busy={busy}
                  rowUploading={uploading === resume.position}
                  rowRemoving={removing === resume.position}
                  isOnCooldown={isOnCooldown}
                  iconPop={iconPop === resume.position}
                  onIconPopEnd={() => setIconPop(null)}
                  onDownload={handleDownload}
                  onReplace={openUploader}
                  onRemove={handleRemove}
                  onLabelUpdated={onLabelUpdated}
                />
              ))}
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
                  className="flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-60"
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
