import { useRef, useState } from 'react'
import { capitalize } from '@/utils/capitalize'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'
import { Download, RotateCcw, Upload, Trash2, Loader2 } from 'lucide-react'
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ErrorBanner } from './ErrorBanner'

type PendingAction =
  | { type: 'upload'; file: File }
  | { type: 'remove' }
  | { type: 'restore' }
  | null

const CONFIRM_COPY: Record<
  Exclude<PendingAction, null>['type'],
  { title: string; description: string; action: string }
> = {
  upload: {
    title: 'Replace uploaded file?',
    description:
      'This will replace the current file and overwrite the editor content with the new file. This cannot be undone.',
    action: 'Replace file',
  },
  remove: {
    title: 'Remove this template?',
    description:
      'This removes the uploaded file and clears the editor content for this variation. This cannot be undone.',
    action: 'Remove file',
  },
  restore: {
    title: 'Restore original?',
    description:
      'This discards all edits and reloads the content from the original uploaded file. This cannot be undone.',
    action: 'Restore original',
  },
}

type Variation = 'formal' | 'light'

interface EditorSidePanelProps {
  variation: Variation
  template: CoverLetterTemplate | undefined
  role: string
  company: string
  onRoleChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onTokenBlur: () => void
  onRestore: () => void
  onDownload: () => void
  onUpload: (file: File) => void
  onRemove: () => void
  isRestoring: boolean
  isDownloading: boolean
  isUploading: boolean
  isRemoving: boolean
  isEditorEmpty: boolean
  isLoadingTokens: boolean
  isLoadingTemplates: boolean
}

function formatLastSaved(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString()
}

function extractFilename(url: string | null): string {
  if (!url) return '-'
  return url.split('/').pop() ?? '-'
}

export function EditorSidePanel({
  variation,
  template,
  role,
  company,
  onRoleChange,
  onCompanyChange,
  onTokenBlur,
  onRestore,
  onDownload,
  onUpload,
  onRemove,
  isRestoring,
  isDownloading,
  isUploading,
  isRemoving,
  isEditorEmpty,
  isLoadingTokens,
  isLoadingTemplates,
}: EditorSidePanelProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const roleEmpty = !role
  const companyEmpty = !company
  const hasUnresolved = roleEmpty || companyEmpty
  const unresolvedCount = (roleEmpty ? 1 : 0) + (companyEmpty ? 1 : 0)
  const label = capitalize(variation)
  const isLoadingDownload = isLoadingTokens || isLoadingTemplates
  const hasFile = !!template?.file_url

  function handleFileSelected(file: File) {
    if (hasFile) {
      setPendingAction({ type: 'upload', file })
    } else {
      onUpload(file)
    }
  }

  function handleRemoveClick() {
    setPendingAction({ type: 'remove' })
  }

  function handleRestoreClick() {
    setPendingAction({ type: 'restore' })
  }

  function handleConfirm() {
    if (!pendingAction) return
    if (pendingAction.type === 'upload') onUpload(pendingAction.file)
    else if (pendingAction.type === 'remove') onRemove()
    else if (pendingAction.type === 'restore') onRestore()
    setPendingAction(null)
  }

  const confirmCopy = pendingAction ? CONFIRM_COPY[pendingAction.type] : null

  return (
    <div className="flex w-80 min-w-60 flex-col overflow-y-auto bg-[#1a1a18]">
      {/* Tokens */}
      <div className="border-b border-[rgba(255,255,255,0.07)] p-4 pb-[18px]">
        <div className="mb-3 text-[11px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Tokens
        </div>

        {isLoadingTokens ? (
          <>
            <div className="mb-2.5">
              <Skeleton className="mb-1 h-[16px] w-14" />
              <Skeleton className="h-[36px] w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="mb-1 h-[16px] w-14" />
              <Skeleton className="h-[36px] w-full rounded-md" />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Skeleton className="h-[18px] w-28" />
            </div>
          </>
        ) : (
          <>
            <div className="mb-2.5">
              <div
                className={`mb-1 font-mono text-xs ${roleEmpty ? 'text-[#f09595]' : 'text-muted-foreground'}`}
              >
                {TOKEN_ROLE}
              </div>
              <input
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
                onBlur={onTokenBlur}
                placeholder="e.g. Software Engineer"
                className={`w-full rounded-md px-2.5 py-[7px] font-sans text-sm outline-none ${
                  roleEmpty
                    ? 'border border-[rgba(220,80,80,0.50)] bg-[rgba(220,80,80,0.06)] text-[#f09595] placeholder:text-[rgba(240,149,149,0.5)]'
                    : 'border border-[rgba(255,255,255,0.08)] bg-secondary text-foreground'
                }`}
              />
            </div>

            <div>
              <div
                className={`mb-1 font-mono text-xs ${companyEmpty ? 'text-[#f09595]' : 'text-muted-foreground'}`}
              >
                {TOKEN_COMPANY}
              </div>
              <input
                value={company}
                onChange={(e) => onCompanyChange(e.target.value)}
                onBlur={onTokenBlur}
                placeholder="e.g. Xiaomi"
                className={`w-full rounded-md px-2.5 py-[7px] font-sans text-sm outline-none ${
                  companyEmpty
                    ? 'border border-[rgba(220,80,80,0.50)] bg-[rgba(220,80,80,0.06)] text-[#f09595] placeholder:text-[rgba(240,149,149,0.5)]'
                    : 'border border-[rgba(255,255,255,0.08)] bg-secondary text-foreground'
                }`}
              />
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs leading-normal">
              <span
                className={`size-1.5 shrink-0 rounded-full ${hasUnresolved ? 'bg-[#f09595]' : 'bg-[#7dd4a0]'}`}
              />
              <span
                className={
                  hasUnresolved ? 'text-[#f09595]' : 'text-muted-foreground'
                }
              >
                {hasUnresolved
                  ? `${unresolvedCount} unresolved token${unresolvedCount > 1 ? 's' : ''}`
                  : 'All tokens resolved'}
              </span>
            </div>
            {hasUnresolved && (
              <div className="mx-auto my-2 w-full">
                <ErrorBanner role={role} company={company} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Version */}
      <div className="border-b border-[rgba(255,255,255,0.07)] p-4 pb-[18px]">
        <div className="mb-3 text-[11px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Version
        </div>

        {isLoadingTemplates ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Editing</span>
              <Skeleton className="h-[20px] w-18" />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uploaded</span>
              <Skeleton className="h-[20px] w-32" />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last saved</span>
              <Skeleton className="h-[20px] w-22" />
            </div>
            <Skeleton className="mt-1 h-[36px] w-full rounded-md" />
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Editing</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uploaded</span>
              <span className="ml-2 truncate text-sm text-muted-foreground">
                {extractFilename(template?.file_url ?? null)}
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last saved</span>
              <span className="text-sm text-muted-foreground">
                {formatLastSaved(template?.updated_at)}
              </span>
            </div>

            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf"
              autoComplete="off"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
                e.target.value = ''
              }}
            />

            <Button
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading || isRestoring || isRemoving}
              className="mb-2 w-full cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload file — {label}
            </Button>

            <button
              onClick={handleRemoveClick}
              disabled={isRemoving || isUploading || !template?.file_url}
              className="mb-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.08)] bg-transparent py-[7px] text-center text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRemoving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
              Remove file
            </button>

            <button
              onClick={handleRestoreClick}
              disabled={
                isRestoring || isUploading || isRemoving || !template?.file_url
              }
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.08)] bg-transparent py-[7px] text-center text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRestoring ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RotateCcw className="size-3" />
              )}
              Restore original file
            </button>
          </>
        )}
      </div>

      {/* Download */}
      <div className="p-4 pb-[18px]">
        <div className="mb-3 text-[11px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Download
        </div>

        {isLoadingDownload ? (
          <Skeleton className="mb-2.5 h-[18px] w-48" />
        ) : (
          <p
            className={`mb-2.5 text-xs leading-normal ${hasUnresolved || isEditorEmpty ? 'text-[#f09595]' : 'text-muted-foreground'}`}
          >
            {isEditorEmpty
              ? 'Editor is empty. Add content to enable download.'
              : hasUnresolved
                ? 'Fill all tokens to enable download.'
                : 'Tokens resolved. Ready to export.'}
          </p>
        )}

        <Button
          onClick={onDownload}
          disabled={
            isLoadingTokens ||
            isLoadingTemplates ||
            hasUnresolved ||
            isEditorEmpty ||
            isDownloading
          }
          className="w-full cursor-pointer"
        >
          {isDownloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download PDF — {label}
        </Button>
      </div>

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmCopy?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
