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
  onUploaded: (path: string) => void
  onRemoved: () => void
}

export function ResumeButton({
  resumeUrl,
  userId,
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
  }, [uploading])

  useLayoutEffect(() => {
    if (removing) {
      if (!resumeUrl) setFalling(true)
      setRemoving(false)
    }
    if (uploading) setUploading(false)
  }, [resumeUrl])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const path = `${userId}/${file.name}`

    if (resumeUrl && resumeUrl !== path) {
      await supabase.storage.from('resumes').remove([resumeUrl])
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
    <div className="flex flex-col gap-3 self-start rounded-lg border border-dashed border-border/50 bg-card px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-secondary">
          <FileText size={14} className="text-muted-foreground/40" />
        </div>
        <div>
          <div className="text-[12px] text-muted-foreground">Resume</div>
          <div className="text-[14px] text-muted-foreground">
            Upload your resume
          </div>
        </div>
      </div>

      <div className="group/slot relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />
        {downloadBubble}
        <button
          disabled={uploading || removing || falling || isOnCooldown}
          onClick={
            resumeUrl ? handleDownload : () => fileInputRef.current?.click()
          }
          className={cn(
            'relative flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-3.5 transition-colors disabled:pointer-events-none',
            showAsFilled
              ? 'border-border bg-card hover:bg-secondary/30'
              : 'border-dashed border-border/50 bg-secondary hover:bg-secondary/70',
          )}
        >
          {removing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-card/80">
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            </div>
          )}
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-md',
              falling
                ? undefined
                : showAsFilled
                  ? 'bg-green-950'
                  : 'bg-background',
              iconPop && 'animate-icon-pop',
              falling && 'animate-icon-fall',
            )}
            onAnimationEnd={() => {
              if (iconPop) setIconPop(false)
              if (falling) setFalling(false)
            }}
          >
            {uploading ? (
              <Loader2
                size={13}
                className="animate-spin text-muted-foreground/40"
              />
            ) : showAsFilled ? (
              <FileText
                size={13}
                className={falling ? undefined : 'text-green-400'}
              />
            ) : (
              <Upload size={13} className="text-muted-foreground/40" />
            )}
          </div>
          <span className="text-[12px] font-medium text-muted-foreground">
            {filename ?? 'Resume'}
          </span>
          <span className="text-[12px] text-muted-foreground/40">
            {showAsFilled ? 'Click to download' : 'Click to upload'}
          </span>
        </button>
        {showAsFilled && (
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
            className="absolute -top-[11px] -right-[11px] z-10 flex size-[24px] cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary disabled:pointer-events-none"
          >
            {removing ? (
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
    </div>
  )
}
