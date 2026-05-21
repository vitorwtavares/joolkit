import { useLayoutEffect, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/utils/downloadFile'
import { useDownloadBubble } from '@/hooks/useDownloadBubble'

interface ResumeButtonProps {
  resumeUrl: string | null
  userId: string
  locked?: boolean
  onUploaded: (path: string) => void
  onRemoved: () => void
}

export function ResumeButton({
  resumeUrl,
  userId,
  locked = false,
  onUploaded,
  onRemoved,
}: ResumeButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [iconPop, setIconPop] = useState(false)
  const [falling, setFalling] = useState(false)
  const prevUploadingRef = useRef(false)
  const {
    trigger: triggerDownload,
    bubble: downloadBubble,
    isOnCooldown,
  } = useDownloadBubble()

  useLayoutEffect(() => {
    const wasUploading = prevUploadingRef.current
    prevUploadingRef.current = uploading
    if (!uploading && wasUploading && resumeUrl) setIconPop(true)
  }, [uploading, resumeUrl])

  // This effect intentionally waits for resumeUrl (the parent's source of
  // truth) to change before clearing the local removing/uploading flags.
  // Including them as deps would re-fire on setRemoving(true) and immediately
  // clear it, killing the spinner mid-action.
  useLayoutEffect(() => {
    if (removing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!resumeUrl) setFalling(true)
      setRemoving(false)
    }
    if (uploading) setUploading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeUrl])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const path = `${userId}/${file.name}`

    if (resumeUrl && resumeUrl !== path) {
      await supabase.storage
        .from('resumes')
        .remove([resumeUrl])
        .catch(() => {})
    }

    const { error } = await supabase.storage
      .from('resumes')
      .upload(path, file, { upsert: true })
    if (error) {
      setUploading(false)
      toast.error('Upload failed: ' + error.message)
      e.target.value = ''
      return
    }

    onUploaded(path)
    toast.success('Resume uploaded')
    e.target.value = ''
  }

  async function handleDownload() {
    if (!resumeUrl) return
    triggerDownload()
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumeUrl, 60)
    if (error || !data) {
      toast.error('Failed to get download link')
      return
    }
    const filename = resumeUrl.split('/').pop()!
    await downloadFile(data.signedUrl, filename)
  }

  const filename = resumeUrl?.split('/').pop() ?? null
  const showAsFilled = !!resumeUrl || falling

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex min-h-[80px] items-center gap-3 border-b border-border px-4">
        <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-secondary">
          <FileText size={14} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-foreground">
            Resume
          </div>
          <div className="text-[12px] whitespace-nowrap text-text-faint">
            Upload your resume
          </div>
        </div>
      </header>

      <div className="group/slot relative min-h-0 flex-1 p-3.5">
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
        <button
          disabled={
            uploading ||
            removing ||
            falling ||
            isOnCooldown ||
            (locked && !resumeUrl)
          }
          onClick={
            resumeUrl ? handleDownload : () => fileInputRef.current?.click()
          }
          className={cn(
            'relative flex h-full min-h-[132px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-5 transition-colors disabled:pointer-events-none',
            showAsFilled
              ? 'border-border bg-secondary hover:border-brand hover:bg-surface-selected'
              : 'border-dashed border-border-strong bg-secondary hover:border-brand hover:bg-surface-selected',
          )}
        >
          {removing && (
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
              falling
                ? undefined
                : showAsFilled
                  ? 'bg-brand-soft text-brand'
                  : 'bg-card text-text-faint',
              iconPop && 'animate-icon-pop',
              falling && 'animate-icon-fall',
            )}
            onAnimationEnd={() => {
              if (iconPop) setIconPop(false)
              if (falling) setFalling(false)
            }}
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin text-text-faint" />
            ) : showAsFilled ? (
              <FileText size={20} />
            ) : (
              <Upload size={20} />
            )}
          </div>
          <span className="max-w-full truncate text-[12.5px] font-medium text-foreground">
            {filename ?? 'Resume'}
          </span>
          <span className="text-[11px] text-text-faint">
            {showAsFilled ? 'Click to download' : 'Click to upload'}
          </span>
        </button>
        {showAsFilled && !locked && (
          <button
            disabled={removing || falling}
            onClick={async (e) => {
              e.stopPropagation()
              setRemoving(true)
              try {
                await supabase.storage.from('resumes').remove([resumeUrl!])
                onRemoved()
              } catch {
                setRemoving(false)
              }
            }}
            aria-label="Remove resume"
            className="absolute top-[22px] right-[22px] z-10 flex size-[26px] cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground opacity-0 transition-[opacity,background-color,color] group-hover/slot:opacity-100 hover:bg-danger-soft-fill hover:text-danger disabled:pointer-events-none"
          >
            {removing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
