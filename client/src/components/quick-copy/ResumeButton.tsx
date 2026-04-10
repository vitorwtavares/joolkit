import { useLayoutEffect, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/utils/downloadFile'

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

  useLayoutEffect(() => {
    setUploading(false)
    setRemoving(false)
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
      return
    }

    onUploaded(path)
    toast.success('Resume uploaded')
    e.target.value = ''
  }

  async function handleDownload() {
    if (!resumeUrl) return
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
        <button
          disabled={uploading || removing}
          onClick={
            resumeUrl ? handleDownload : () => fileInputRef.current?.click()
          }
          className={cn(
            'relative flex w-full flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-3.5 transition-colors disabled:pointer-events-none',
            resumeUrl
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
              resumeUrl ? 'bg-green-950' : 'bg-background',
            )}
          >
            {uploading ? (
              <Loader2
                size={13}
                className="animate-spin text-muted-foreground/40"
              />
            ) : resumeUrl ? (
              <FileText size={13} className="text-green-400" />
            ) : (
              <Upload size={13} className="text-muted-foreground/40" />
            )}
          </div>
          <span className="text-[12px] font-medium text-muted-foreground">
            {filename ?? 'Resume'}
          </span>
          <span className="text-[12px] text-muted-foreground/40">
            {resumeUrl ? 'Click to download' : 'Click to upload'}
          </span>
        </button>
        {resumeUrl && (
          <button
            disabled={removing}
            onClick={async (e) => {
              e.stopPropagation()
              setRemoving(true)
              try {
                await supabase.storage.from('resumes').remove([resumeUrl])
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
