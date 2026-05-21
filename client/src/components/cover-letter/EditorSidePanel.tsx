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
    <div className="flex w-80 min-w-60 flex-col overflow-y-auto bg-surface-panel">
      {/* Tokens */}
      <div className="border-b border-border-subtle p-4 pb-[18px]">
        <div className="mb-3.5 text-[11px] font-medium tracking-[0.08em] text-text-faint uppercase">
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
            <div className="mb-3 flex flex-col gap-1.5">
              <label
                htmlFor="cover-letter-role"
                className={`font-mono text-[11px] font-medium tracking-[0.04em] ${roleEmpty ? 'text-danger' : 'text-muted-foreground'}`}
              >
                {TOKEN_ROLE}
              </label>
              <input
                id="cover-letter-role"
                name="cover-letter-role"
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
                onBlur={onTokenBlur}
                placeholder="e.g. Software Engineer"
                className={`h-8 w-full rounded-md px-2.5 font-sans text-[13px] transition-[border-color,box-shadow] outline-none ${
                  roleEmpty
                    ? 'border border-danger-border bg-danger-soft text-danger placeholder:text-danger-muted'
                    : 'border border-border bg-card text-foreground focus:border-brand-border focus:ring-3 focus:ring-brand-soft'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cover-letter-company"
                className={`font-mono text-[11px] font-medium tracking-[0.04em] ${companyEmpty ? 'text-danger' : 'text-muted-foreground'}`}
              >
                {TOKEN_COMPANY}
              </label>
              <input
                id="cover-letter-company"
                name="cover-letter-company"
                value={company}
                onChange={(e) => onCompanyChange(e.target.value)}
                onBlur={onTokenBlur}
                placeholder="e.g. Xiaomi"
                className={`h-8 w-full rounded-md px-2.5 font-sans text-[13px] transition-[border-color,box-shadow] outline-none ${
                  companyEmpty
                    ? 'border border-danger-border bg-danger-soft text-danger placeholder:text-danger-muted'
                    : 'border border-border bg-card text-foreground focus:border-brand-border focus:ring-3 focus:ring-brand-soft'
                }`}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-[12px] leading-normal">
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  hasUnresolved
                    ? 'bg-danger shadow-[0_0_0_3px_var(--danger-soft-fill)]'
                    : 'bg-success shadow-[0_0_0_3px_rgba(95,191,129,0.16)]'
                }`}
              />
              <span
                className={
                  hasUnresolved ? 'text-danger' : 'text-muted-foreground'
                }
              >
                {hasUnresolved
                  ? `${unresolvedCount} unresolved token${unresolvedCount > 1 ? 's' : ''}`
                  : 'All tokens resolved'}
              </span>
            </div>
            {hasUnresolved && (
              <div className="mt-3 w-full">
                <ErrorBanner role={role} company={company} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Version */}
      <div className="border-b border-border-subtle p-4 pb-[18px]">
        <div className="mb-3.5 text-[11px] font-medium tracking-[0.08em] text-text-faint uppercase">
          Version
        </div>

        {isLoadingTemplates ? (
          <>
            <dl className="mb-3 flex flex-col gap-1.5">
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Editing</dt>
                <dd className="m-0">
                  <Skeleton className="h-[18px] w-18" />
                </dd>
              </div>
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Uploaded</dt>
                <dd className="m-0">
                  <Skeleton className="h-[18px] w-32" />
                </dd>
              </div>
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Last saved</dt>
                <dd className="m-0">
                  <Skeleton className="h-[18px] w-22" />
                </dd>
              </div>
            </dl>
            <Skeleton className="h-[34px] w-full rounded-md" />
          </>
        ) : (
          <>
            <dl className="mb-3 flex flex-col gap-1.5">
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Editing</dt>
                <dd className="m-0 font-medium text-foreground">{label}</dd>
              </div>
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Uploaded</dt>
                <dd className="m-0 truncate font-medium text-foreground">
                  {extractFilename(template?.file_url ?? null)}
                </dd>
              </div>
              <div className="grid grid-cols-[92px_1fr] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Last saved</dt>
                <dd className="m-0 font-medium text-foreground">
                  {formatLastSaved(template?.updated_at)}
                </dd>
              </div>
            </dl>

            <input
              ref={uploadInputRef}
              id="cover-letter-template-upload"
              name="cover-letter-template-upload"
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
              className="mb-2 h-[34px] w-full cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload file — {label}
            </Button>

            <Button
              variant="outline"
              onClick={handleRemoveClick}
              disabled={isRemoving || isUploading || !template?.file_url}
              className="mb-2 h-[34px] w-full cursor-pointer"
            >
              {isRemoving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
              Remove file
            </Button>

            <Button
              variant="outline"
              onClick={handleRestoreClick}
              disabled={
                isRestoring || isUploading || isRemoving || !template?.file_url
              }
              className="h-[34px] w-full cursor-pointer"
            >
              {isRestoring ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RotateCcw className="size-3" />
              )}
              Restore original file
            </Button>
          </>
        )}
      </div>

      {/* Download */}
      <div className="p-4 pb-[18px]">
        <div className="mb-3.5 text-[11px] font-medium tracking-[0.08em] text-text-faint uppercase">
          Download
        </div>

        {isLoadingDownload ? (
          <Skeleton className="mb-2 h-[18px] w-48" />
        ) : (
          <p
            className={`mb-2 text-[12.5px] leading-normal ${hasUnresolved || isEditorEmpty ? 'text-danger' : 'text-muted-foreground'}`}
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
          className="h-[34px] w-full cursor-pointer"
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
