import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { useCoverLetters } from '@/api/hooks/useCoverLetters'
import { useCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'
import { useTokenState } from '@/hooks/useTokenState'
import { EditorToolbar } from './editor/EditorToolbar'
import { EditorSidePanel } from './editor/EditorSidePanel'
import { EditorCanvas } from './editor/EditorCanvas'
import { EditorStatusBar } from './editor/EditorStatusBar'
import { CoverLetterToolbar } from './editor/CoverLetterToolbar'
import { useEditorCore } from './editor/useEditorCore'
import { useVariationActions } from './editor/useVariationActions'
import { CoverLetterConfirmDialog } from './dialogs/CoverLetterConfirmDialog'
import { DiscardChangesDialog } from './dialogs/DiscardChangesDialog'
import {
  getCoverLetterFilename,
  COVER_LETTER_LABEL_MAX_LENGTH,
} from './variations/coverLetterVariationUtils'

export function CoverLetterEditor() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedVariation = searchParams.get('v')

  const { data: tokenData, isLoading: tokensLoading } = useCoverLetterTokens()
  const {
    tokens,
    updateToken,
    addToken,
    ensureTokenByKey,
    deleteToken,
    flushTokenSave,
    flushTokenSaveAsync,
  } = useTokenState(tokenData)

  const { data: templates = [], isLoading: templatesLoading } =
    useCoverLetters()
  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.position - b.position),
    [templates],
  )
  const template =
    sortedTemplates.find((t) => t.variation === requestedVariation) ??
    sortedTemplates[0]
  // Always a real variation key or empty — never a stale/deleted ?v= value.
  const variation = template?.variation ?? ''

  const {
    editor,
    previewEditor,
    isDirty,
    setIsDirty,
    isPreview,
    setIsPreview,
    focusTokenKey,
    setFocusTokenKey,
    isEditorEmpty,
    tokenValidation,
    hasUnresolved,
    downloadDisabled,
    handleSave,
    handleRestore,
    handleCopyToClipboard,
    handleDownload,
    isSaving,
    isRestoring,
    isDownloading,
  } = useEditorCore({
    requestedVariation,
    setSearchParams,
    template,
    variation,
    templatesLoading,
    tokens,
    ensureTokenByKey,
    flushTokenSaveAsync,
    tokensLoading,
  })

  const {
    uploadingVariation,
    removingVariation,
    savingLabelVariation,
    pendingAction,
    setPendingAction,
    pendingDiscard,
    setPendingDiscard,
    uploadInputRef,
    titleInputRef,
    isUploading,
    isRemoving,
    openUploader,
    handleFileSelected,
    handleTitleBlur,
    handleConfirmAction,
    handleRequestCreateEmpty,
    handleVariationRename,
    requestRemove,
    requestRestore,
    requestVariationSwitch,
  } = useVariationActions({
    user,
    editor,
    variation,
    template,
    sortedTemplates,
    isDirty,
    setIsDirty,
    setSearchParams,
    isEditorEmpty,
    handleRestore,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
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

      {/* Header */}
      <div className="flex h-[62px] shrink-0 border-b border-border-subtle">
        <div className="flex min-w-0 flex-1 items-center px-[18px]">
          {templatesLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <input
                key={template?.variation}
                ref={titleInputRef}
                defaultValue={template?.label ?? ''}
                disabled={!template || savingLabelVariation !== null}
                maxLength={COVER_LETTER_LABEL_MAX_LENGTH}
                aria-label="Cover letter variation name"
                onBlur={(event) => handleTitleBlur(event.currentTarget)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') {
                    event.currentTarget.value = template?.label ?? ''
                    event.currentTarget.blur()
                  }
                }}
                className="[field-sizing:content] max-w-full min-w-[2ch] cursor-text bg-transparent text-left text-[18px] font-semibold text-foreground outline-none disabled:pointer-events-none disabled:opacity-60"
              />
              <span className="shrink-0 px-1.5 text-[15px] text-text-faint">
                —
              </span>
              <span className="min-w-0 truncate text-[14px] leading-tight text-muted-foreground">
                {template?.file_url
                  ? getCoverLetterFilename(template.file_url)
                  : 'No file uploaded'}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 pr-[18px] pl-3">
          {!templatesLoading && (
            <CoverLetterToolbar
              onUpload={() => openUploader(template ? variation : null)}
              onRemove={() => template && requestRemove(template)}
              onRestore={requestRestore}
              onDownload={handleDownload}
              isUploading={isUploading}
              isRemoving={isRemoving}
              isRestoring={isRestoring}
              isDownloading={isDownloading}
              canRemove={!!template}
              canRestore={!!template?.file_url}
              downloadDisabled={downloadDisabled}
            />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex shrink-0 border-b border-border-subtle">
            <div className="flex flex-1 items-center border-r border-border-subtle">
              <EditorToolbar
                editor={editor}
                isPreview={isPreview}
                onTogglePreview={() => setIsPreview((prev) => !prev)}
                onCopy={() => void handleCopyToClipboard()}
              />
              {isDirty && (
                <span className="mr-3 text-[14px] text-destructive/60">
                  Unsaved changes
                </span>
              )}
              <Button
                className="mr-4 ml-auto px-8 hover:cursor-pointer"
                onClick={handleSave}
                disabled={isSaving || !template}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden border-r border-border-subtle bg-surface-editor">
              <EditorCanvas
                isLoading={
                  templatesLoading ||
                  isRestoring ||
                  uploadingVariation !== null ||
                  removingVariation !== null
                }
                editor={editor}
                previewEditor={previewEditor}
                isPreview={isPreview}
              />
            </div>
          </div>
        </div>

        {/* Side panel */}
        <EditorSidePanel
          templates={sortedTemplates}
          variation={variation}
          template={template}
          onVariationChange={(nextVariation) =>
            requestVariationSwitch(nextVariation)
          }
          onVariationRename={handleVariationRename}
          onRequestUpload={() => openUploader(template ? variation : null)}
          onRequestAddVariation={() => openUploader(null)}
          onRequestCreateEmpty={handleRequestCreateEmpty}
          onRequestRemove={requestRemove}
          onRequestRestore={requestRestore}
          onDownload={handleDownload}
          tokens={tokens}
          onTokenChange={updateToken}
          onTokenDelete={deleteToken}
          onTokenAdd={addToken}
          onTokenBlur={flushTokenSave}
          focusTokenKey={focusTokenKey}
          onFocusTokenKeyHandled={() => setFocusTokenKey(null)}
          isRestoring={isRestoring}
          isDownloading={isDownloading}
          isUploading={isUploading}
          uploadingVariation={uploadingVariation}
          removingVariation={removingVariation}
          savingLabelVariation={savingLabelVariation}
          isRemoving={isRemoving}
          isEditorEmpty={isEditorEmpty}
          isLoadingTokens={tokensLoading}
          isLoadingTemplates={templatesLoading}
          unresolvedTokens={tokenValidation.unresolvedTokens}
          downloadDisabled={downloadDisabled}
        />
      </div>

      <EditorStatusBar hasUnresolved={hasUnresolved} />

      <CoverLetterConfirmDialog
        pendingAction={pendingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <DiscardChangesDialog
        open={pendingDiscard !== null}
        onKeepEditing={() => setPendingDiscard(null)}
        onDiscard={() => {
          pendingDiscard?.run()
          setPendingDiscard(null)
        }}
      />
    </div>
  )
}
