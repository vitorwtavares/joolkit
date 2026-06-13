import { Download, RotateCcw, Trash2, Upload } from 'lucide-react'
import type { CoverLetterTemplate } from '@/api/hooks/useCoverLetters'
import { FREE_COVER_LETTER_VARIATION_LIMIT } from '@/components/billing/planData'
import type { PdfExportUsage } from '@/api/hooks/useBilling'
import { LimitBadge } from '@/components/billing/LimitBadge'
import { useResourceLimit } from '@/components/billing/useResourceLimit'
import { Skeleton } from '@/components/ui/skeleton'
import { CoverLetterVariationList } from '../variations/CoverLetterVariationList'
import { CoverLetterTokenPanel } from '../tokens/CoverLetterTokenPanel'
import { CoverLetterActionButton } from '../variations/CoverLetterActionButton'
import { UnresolvedTokensIndicator } from '../tokens/UnresolvedTokensIndicator'
import type { EditableCoverLetterToken } from '../tokens/tokenUtils'
import {
  COVER_LETTER_FALLBACK_LABEL,
  getCoverLetterFilename,
} from '../variations/coverLetterVariationUtils'

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
  tokens: EditableCoverLetterToken[]
  onTokenChange: (
    id: string,
    patch: Partial<Pick<EditableCoverLetterToken, 'key' | 'value'>>,
  ) => void
  onTokenDelete: (id: string) => void
  onTokenAdd: () => void
  onTokenBlur: () => void
  focusTokenKey?: string | null
  onFocusTokenKeyHandled?: () => void
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
  unresolvedTokens: string[]
  downloadDisabled: boolean
  pdfExports: PdfExportUsage | undefined
  exportLimitReached: boolean
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

// Coarse "resets in Xh/Xm" for the daily export window — precision isn't needed.
function formatResetIn(resetAt: string | null): string {
  if (!resetAt) return 'soon'
  const ms = new Date(resetAt).getTime() - Date.now()
  if (ms <= 0) return 'soon'
  const mins = Math.ceil(ms / 60_000)
  if (mins < 60) return `in ${mins}m`
  return `in ${Math.round(mins / 60)}h`
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
  tokens,
  onTokenChange,
  onTokenDelete,
  onTokenAdd,
  onTokenBlur,
  focusTokenKey,
  onFocusTokenKeyHandled,
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
  unresolvedTokens,
  downloadDisabled,
  pdfExports: pdf,
  exportLimitReached,
}: EditorSidePanelProps) {
  const coverUsage = useResourceLimit('coverLetterVariations', templates.length)
  const tokenUsage = useResourceLimit('tokenDefinitions', tokens.length)
  const coverLimit = coverUsage.limit ?? FREE_COVER_LETTER_VARIATION_LIMIT
  const tokenLimit = tokenUsage.limit

  const hasUnresolved = unresolvedTokens.length > 0
  const label = template?.label ?? COVER_LETTER_FALLBACK_LABEL
  const isLoadingDownload = isLoadingTokens || isLoadingTemplates
  const variationsBusy =
    isUploading || isRemoving || savingLabelVariation !== null

  return (
    <div className="flex w-[370px] min-w-[290px] flex-col overflow-y-auto bg-surface-panel">
      {/* Variations */}
      <div className="border-b border-border-subtle p-3.5">
        <div className="mb-3.5 flex items-center gap-2 text-[12px] font-medium tracking-[0.08em] text-text-faint uppercase">
          Variations
          <LimitBadge
            used={templates.length}
            limit={coverLimit}
            isLoading={coverUsage.isLoading}
            atLimit={coverUsage.atLimit}
            className="tracking-normal normal-case"
          />
        </div>

        <div className="flex h-[240px] min-h-0 flex-col">
          <CoverLetterVariationList
            templates={templates}
            activeVariation={variation}
            busy={variationsBusy}
            isLoading={isLoadingTemplates}
            uploadingVariation={uploadingVariation}
            removingVariation={removingVariation}
            savingLabelVariation={savingLabelVariation}
            skeletonRows={3}
            limit={coverLimit}
            planLoading={coverUsage.isLoading}
            onUpgrade={coverUsage.onUpgrade}
            emptyDescription={`Add up to ${coverLimit} variations. Select one to edit it here.`}
            onAdd={onRequestAddVariation}
            onAddEmpty={onRequestCreateEmpty}
            onSelect={(item) => onVariationChange(item.variation)}
            onRemove={onRequestRemove}
            onRename={onVariationRename}
          />
        </div>

        {coverUsage.hidden > 0 && (
          <p className="mt-2 text-[11px] text-text-faint">
            {coverUsage.hidden} more{' '}
            {coverUsage.hidden === 1 ? 'variation is' : 'variations are'} safely
            saved from Pro. Upgrade to use{' '}
            {coverUsage.hidden === 1 ? 'it' : 'them'} again.
          </p>
        )}
      </div>

      {/* Tokens */}
      <div className="border-b border-border-subtle p-3.5">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] font-medium tracking-[0.08em] text-text-faint uppercase">
            Tokens
            {typeof tokenLimit === 'number' && (
              <LimitBadge
                used={tokens.length}
                limit={tokenLimit}
                isLoading={tokenUsage.isLoading}
                atLimit={tokenUsage.atLimit}
                className="tracking-normal normal-case"
              />
            )}
          </div>
          <UnresolvedTokensIndicator
            unresolvedTokens={unresolvedTokens}
            isLoading={isLoadingTokens}
          />
        </div>

        <div className="flex h-[250px] min-h-0 flex-col">
          <CoverLetterTokenPanel
            tokens={tokens}
            unresolvedTokens={unresolvedTokens}
            isLoading={isLoadingTokens}
            variant="section"
            tokenLimit={tokenUsage.isLoading ? undefined : tokenUsage.limit}
            hiddenCount={tokenUsage.hidden}
            onUpgrade={tokenUsage.onUpgrade}
            onTokenChange={onTokenChange}
            onTokenDelete={onTokenDelete}
            onTokenAdd={onTokenAdd}
            onTokenBlur={onTokenBlur}
            focusTokenKey={focusTokenKey}
            onFocusTokenKeyHandled={onFocusTokenKeyHandled}
          />
        </div>
      </div>

      {/* Version */}
      <div className="border-b border-border-subtle p-4 pb-[18px]">
        <div className="mb-3.5 text-[12px] font-medium tracking-[0.08em] text-text-faint uppercase">
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
        <div className="mb-3.5 text-[12px] font-medium tracking-[0.08em] text-text-faint uppercase">
          Download
        </div>

        {isLoadingDownload ? (
          <Skeleton className="mb-2 h-[18px] w-48" />
        ) : (
          <p
            className={`mb-2 text-[12.5px] leading-normal ${isEditorEmpty ? 'text-danger' : hasUnresolved ? 'text-token-unresolved' : 'text-muted-foreground'}`}
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

        {!isLoadingDownload && pdf && (
          <div className="mt-2">
            {exportLimitReached ? (
              <p className="text-[12px] leading-normal text-token-unresolved">
                Daily export limit reached ({pdf.limit}/day) · resets{' '}
                {formatResetIn(pdf.resetAt)}.
              </p>
            ) : (
              <p className="text-[11px] text-text-faint">
                {pdf.remaining} of {pdf.limit} daily export
                {pdf.limit === 1 ? '' : 's'} left.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
