import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react'
import {
  COVER_LETTER_VARIATION_LIMIT,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { Skeleton } from '@/components/ui/skeleton'
import { CoverLetterVariationList } from './CoverLetterVariationList'
import { CoverLetterActionButton } from './CoverLetterActionButton'
import {
  COVER_LETTER_FALLBACK_LABEL,
  getCoverLetterFilename,
} from './coverLetterVariationUtils'
import { ErrorBanner } from './ErrorBanner'

interface EditorSidePanelProps {
  templates: CoverLetterTemplate[]
  variation: string
  template: CoverLetterTemplate | undefined
  onVariationChange: (variation: string) => void
  onVariationRename: (template: CoverLetterTemplate) => void
  onRequestUpload: () => void
  onRequestAddVariation: () => void
  onRequestCreateEmpty: () => void
  onRequestRemove: (template: CoverLetterTemplate) => void
  onRequestRestore: () => void
  onDownload: () => void
  role: string
  company: string
  onRoleChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onTokenBlur: () => void
  isRestoring: boolean
  isDownloading: boolean
  isUploading: boolean
  uploadingVariation: string | null
  removingVariation: string | null
  savingLabelVariation: string | null
  isRemoving: boolean
  isEditorEmpty: boolean
  isLoadingTokens: boolean
  isLoadingTemplates: boolean
  isRoleUnresolved: boolean
  isCompanyUnresolved: boolean
  unresolvedTokens: string[]
  downloadDisabled: boolean
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
  return getCoverLetterFilename(url)
}

export function EditorSidePanel({
  templates,
  variation,
  template,
  onVariationChange,
  onVariationRename,
  onRequestUpload,
  onRequestAddVariation,
  onRequestCreateEmpty,
  onRequestRemove,
  onRequestRestore,
  onDownload,
  role,
  company,
  onRoleChange,
  onCompanyChange,
  onTokenBlur,
  isRestoring,
  isDownloading,
  isUploading,
  uploadingVariation,
  removingVariation,
  savingLabelVariation,
  isRemoving,
  isEditorEmpty,
  isLoadingTokens,
  isLoadingTemplates,
  isRoleUnresolved,
  isCompanyUnresolved,
  unresolvedTokens,
  downloadDisabled,
}: EditorSidePanelProps) {
  const hasUnresolved = unresolvedTokens.length > 0
  const unresolvedCount = unresolvedTokens.length
  const label = template?.label ?? COVER_LETTER_FALLBACK_LABEL
  const isLoadingDownload = isLoadingTokens || isLoadingTemplates
  const variationsBusy =
    isUploading || isRemoving || savingLabelVariation !== null

  return (
    <div className="flex w-[370px] min-w-[290px] flex-col overflow-y-auto bg-surface-panel">
      {/* Variations */}
      <div className="border-b border-border-subtle p-3.5">
        <div className="mb-3.5 text-[11px] font-medium tracking-[0.08em] text-text-faint uppercase">
          Variations
        </div>

        <div className="flex h-[300px] min-h-0 flex-col">
          <CoverLetterVariationList
            templates={templates}
            activeVariation={variation}
            busy={variationsBusy}
            isLoading={isLoadingTemplates}
            uploadingVariation={uploadingVariation}
            removingVariation={removingVariation}
            savingLabelVariation={savingLabelVariation}
            skeletonRows={3}
            emptyDescription={`Add up to ${COVER_LETTER_VARIATION_LIMIT} variations. Select one to edit it here.`}
            onAdd={onRequestAddVariation}
            onAddEmpty={onRequestCreateEmpty}
            onSelect={(item) => onVariationChange(item.variation)}
            onRemove={onRequestRemove}
            onRename={onVariationRename}
          />
        </div>
      </div>

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
                className={`font-mono text-[11px] font-medium tracking-[0.04em] ${isRoleUnresolved ? 'text-danger' : 'text-muted-foreground'}`}
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
                  isRoleUnresolved
                    ? 'border border-danger-border bg-danger-soft text-danger placeholder:text-danger-muted'
                    : 'border border-border bg-card text-foreground focus:border-brand-border focus:ring-3 focus:ring-brand-soft'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cover-letter-company"
                className={`font-mono text-[11px] font-medium tracking-[0.04em] ${isCompanyUnresolved ? 'text-danger' : 'text-muted-foreground'}`}
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
                  isCompanyUnresolved
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
                <ErrorBanner unresolvedTokens={unresolvedTokens} />
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
              <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Editing</dt>
                <dd
                  title={label}
                  className="m-0 truncate font-medium text-foreground"
                >
                  {label}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Uploaded</dt>
                <dd className="m-0 truncate font-medium text-foreground">
                  {extractFilename(template?.file_url ?? null)}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-baseline gap-2.5 text-[12.5px]">
                <dt className="text-text-faint">Last saved</dt>
                <dd className="m-0 font-medium text-foreground">
                  {formatLastSaved(template?.updated_at)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2">
              <CoverLetterActionButton
                layout="panel"
                variant="outline"
                icon={Upload}
                label={`Upload file — ${label}`}
                compactLabel="Upload"
                truncate
                onClick={onRequestUpload}
                loading={isUploading}
                disabled={isUploading || isRestoring || isRemoving}
              />
              <CoverLetterActionButton
                layout="panel"
                variant="outline"
                icon={Trash2}
                label="Remove"
                compactLabel="Remove"
                onClick={() => template && onRequestRemove(template)}
                loading={isRemoving}
                disabled={isRemoving || isUploading || !template}
              />
              <CoverLetterActionButton
                layout="panel"
                variant="outline"
                icon={RotateCcw}
                label="Restore original file"
                compactLabel="Restore"
                onClick={onRequestRestore}
                loading={isRestoring}
                disabled={
                  isRestoring ||
                  isUploading ||
                  isRemoving ||
                  !template?.file_url
                }
              />
            </div>
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

        <CoverLetterActionButton
          layout="panel"
          icon={Download}
          label={`Download PDF — ${label}`}
          compactLabel="Download"
          truncate
          onClick={onDownload}
          loading={isDownloading}
          disabled={downloadDisabled || isDownloading}
        />
      </div>
    </div>
  )
}
