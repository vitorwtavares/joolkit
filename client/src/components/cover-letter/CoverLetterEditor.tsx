import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import {
  useCreateCoverLetterVariation,
  useCoverLetters,
  useUpdateCoverLetterContent,
  useUpdateCoverLetterFile,
  useDeleteCoverLetterTemplate,
  useRestoreCoverLetter,
  useExportCoverLetterPDF,
  useUpdateCoverLetterLabel,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { useCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'
import { useTokenState } from '@/hooks/useTokenState'
import { TokenHighlight, setTokenHighlight } from './tokenHighlight'
import { EditorToolbar } from './EditorToolbar'
import { EditorSidePanel } from './EditorSidePanel'
import { EditorCanvas } from './EditorCanvas'
import { EditorStatusBar } from './EditorStatusBar'
import { CoverLetterToolbar } from './CoverLetterToolbar'
import {
  CoverLetterConfirmDialog,
  type PendingAction,
} from './CoverLetterConfirmDialog'
import { getCoverLetterTokenValidation } from './tokenValidation'
import {
  COVER_LETTER_FALLBACK_LABEL,
  COVER_LETTER_LABEL_MAX_LENGTH,
  getCoverLetterFilename,
  getCoverLetterLabelValue,
  getCoverLetterTemplatePath,
} from './coverLetterVariationUtils'

// Editor toasts sit bottom-center so they don't cover the header toolbar.
const TOAST_POSITION = { position: 'bottom-center' } as const

const PAGE_CONTENT_HEIGHT = 1123 - 80 * 2
const MAX_PAGES = 3
const MAX_CONTENT_HEIGHT = PAGE_CONTENT_HEIGHT * MAX_PAGES

const PageHeightLimit = Extension.create<{ onPasteRejected?: () => void }>({
  name: 'pageHeightLimit',

  addOptions() {
    return { onPasteRejected: undefined }
  },

  addKeyboardShortcuts() {
    const blocked = () => {
      const el = this.editor.view.dom as HTMLElement
      return el.scrollHeight >= MAX_CONTENT_HEIGHT
    }
    return {
      Enter: () => blocked(),
      'Shift-Enter': () => blocked(),
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const opts = this.options
    return [
      new Plugin({
        props: {
          handlePaste: (view) => {
            const el = view.dom as HTMLElement
            if (el.scrollHeight >= MAX_CONTENT_HEIGHT) {
              toast.error(
                'Content limit reached — remove some content before pasting',
                TOAST_POSITION,
              )
              return true
            }
            const scrollContainer = el.closest('.editor-canvas')
            const scrollTop = scrollContainer?.scrollTop ?? 0
            requestAnimationFrame(() => {
              if ((view.dom as HTMLElement).scrollHeight > MAX_CONTENT_HEIGHT) {
                editor.commands.undo()
                if (scrollContainer) scrollContainer.scrollTop = scrollTop
                toast.error(
                  'Pasted content exceeds the page limit and was removed',
                  TOAST_POSITION,
                )
                opts.onPasteRejected?.()
              }
            })
            return false
          },
        },
      }),
    ]
  },
})

const ParagraphFontFamily = Extension.create({
  name: 'paragraphFontFamily',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontFamily?.replace(/['"]/g, '') ||
              null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {}
              return { style: `font-family: ${attributes.fontFamily}` }
            },
          },
        },
      },
    ]
  },
})

export function CoverLetterEditor() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedVariation = searchParams.get('v')
  const [uploadingVariation, setUploadingVariation] = useState<string | null>(
    null,
  )
  const [removingVariation, setRemovingVariation] = useState<string | null>(
    null,
  )
  const [savingLabelVariation, setSavingLabelVariation] = useState<
    string | null
  >(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)

  const { data: tokenData, isLoading: tokensLoading } = useCoverLetterTokens()
  const {
    role,
    setRole,
    company,
    setCompany,
    scheduleTokenSave,
    flushTokenSave,
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

  const createVariation = useCreateCoverLetterVariation()
  const updateContent = useUpdateCoverLetterContent()
  const updateFile = useUpdateCoverLetterFile()
  const updateLabel = useUpdateCoverLetterLabel()
  const deleteTemplate = useDeleteCoverLetterTemplate()
  const restoreMutation = useRestoreCoverLetter()
  const exportPDF = useExportCoverLetterPDF()

  const [isDirty, setIsDirty] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      ParagraphFontFamily,
      PageHeightLimit.configure({
        onPasteRejected: () => setIsDirty(false),
      }),
      TokenHighlight,
    ],
    onUpdate: () => setIsDirty(true),
  })

  // Load content on mount and variation switch.
  // Wait for templates to finish loading before committing lastVariation so that
  // data arriving after the editor is ready doesn't get skipped.
  useEffect(() => {
    if (templatesLoading) return
    if (!template) return
    if (requestedVariation === template.variation) return
    setSearchParams({ v: template.variation }, { replace: true })
  }, [requestedVariation, setSearchParams, template, templatesLoading])

  const titleInputRef = useRef<HTMLInputElement>(null)
  const pendingTitleFocus = useRef(false)

  // Focus the header label input after switching to a variation queued for rename.
  useEffect(() => {
    if (!pendingTitleFocus.current) return
    pendingTitleFocus.current = false
    const input = titleInputRef.current
    input?.focus()
    input?.select()
  }, [template?.variation])

  const lastVariation = useRef<string | null>(null)
  useEffect(() => {
    if (!editor || templatesLoading) return
    if (lastVariation.current === variation) return
    lastVariation.current = variation
    editor.commands.setContent(
      (template?.content as Record<string, unknown>) ?? {
        type: 'doc',
        content: [],
      },
      { emitUpdate: false },
    )
    setIsDirty(false)
  }, [editor, template, variation, templatesLoading])

  // Sync token decorations
  useEffect(() => {
    if (!editor?.view) return
    setTokenHighlight(editor.view, {
      role: role || null,
      company: company || null,
    })
  }, [editor, role, company])

  const { isEmpty: isEditorEmpty, text: editorText } = useEditorState({
    editor,
    selector: (ctx) => ({
      isEmpty: ctx.editor?.isEmpty ?? true,
      text: ctx.editor?.getText() ?? '',
    }),
  })

  const tokenValidation = getCoverLetterTokenValidation({
    text: editorText,
    role,
    company,
  })
  const hasUnresolved = tokenValidation.unresolvedTokens.length > 0

  const handleTokenBlur = () => flushTokenSave(role, company)

  const handleSave = () => {
    if (!editor || !variation) return
    updateContent.mutate(
      { variation, content: editor.getJSON() },
      {
        onSuccess: () => {
          setIsDirty(false)
          toast.success('Saved', TOAST_POSITION)
        },
      },
    )
  }

  const handleRestore = () => {
    if (!variation) return
    restoreMutation.mutate(variation, {
      onSuccess: (data) => {
        if (editor && data.content) {
          editor.commands.setContent(data.content as Record<string, unknown>, {
            emitUpdate: false,
          })
          setIsDirty(false)
        }
      },
    })
  }

  const handleVariationUpload = async (
    targetVariation: string | null,
    file: File,
  ) => {
    if (!user) return
    const label = targetVariation
      ? (sortedTemplates.find((t) => t.variation === targetVariation)?.label ??
        COVER_LETTER_FALLBACK_LABEL)
      : COVER_LETTER_FALLBACK_LABEL
    const path = getCoverLetterTemplatePath(user.id, targetVariation, file.name)
    const uploadingKey = targetVariation ?? 'new'
    const targetTemplate =
      sortedTemplates.find((t) => t.variation === targetVariation) ?? null

    setUploadingVariation(uploadingKey)

    const { error: uploadError } = await supabase.storage
      .from('cover-letters')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploadingVariation(null)
      toast.error('Upload failed: ' + uploadError.message, TOAST_POSITION)
      return
    }

    try {
      const data = targetVariation
        ? await updateFile.mutateAsync({
            variation: targetVariation,
            file_url: path,
          })
        : await createVariation.mutateAsync({ file_url: path, label })

      if (
        targetTemplate?.file_url &&
        targetTemplate.file_url !== path &&
        targetVariation
      ) {
        await supabase.storage
          .from('cover-letters')
          .remove([targetTemplate.file_url])
          .catch(() => {})
      }

      if (!targetVariation) {
        setSearchParams({ v: data.variation }, { replace: true })
      }

      if (editor && data.variation === variation && data.content) {
        editor.commands.setContent(data.content as Record<string, unknown>, {
          emitUpdate: false,
        })
        setIsDirty(false)
      }

      toast.success(`${data.label} uploaded`, TOAST_POSITION)
    } catch (err) {
      await supabase.storage
        .from('cover-letters')
        .remove([path])
        .catch(() => {})
      const msg = err instanceof Error ? err.message : 'Failed to save file'
      toast.error(msg, TOAST_POSITION)
    } finally {
      setUploadingVariation(null)
    }
  }

  const handleRemove = async (targetTemplate: CoverLetterTemplate) => {
    setRemovingVariation(targetTemplate.variation)
    try {
      const nextTemplates = await deleteTemplate.mutateAsync(
        targetTemplate.variation,
      )

      if (targetTemplate.file_url) {
        await supabase.storage
          .from('cover-letters')
          .remove([targetTemplate.file_url])
          .catch(() => {})
      }

      if (targetTemplate.variation === variation) {
        const remainingTemplates = Array.isArray(nextTemplates)
          ? nextTemplates
          : sortedTemplates.filter(
              (t) => t.variation !== targetTemplate.variation,
            )
        const nextTemplate = remainingTemplates[0]
        if (nextTemplate) {
          setSearchParams({ v: nextTemplate.variation }, { replace: true })
        } else if (editor) {
          editor.commands.setContent(
            { type: 'doc', content: [] },
            { emitUpdate: false },
          )
          setIsDirty(false)
        }
      }

      toast.success('Cover letter removed', TOAST_POSITION)
    } catch {
      toast.error('Failed to remove template', TOAST_POSITION)
    } finally {
      setRemovingVariation(null)
    }
  }

  const handleVariationRename = (targetTemplate: CoverLetterTemplate) => {
    if (targetTemplate.variation === variation) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
      return
    }
    pendingTitleFocus.current = true
    setSearchParams({ v: targetTemplate.variation }, { replace: true })
  }

  const handleDownload = () => {
    if (!variation) return
    if (hasUnresolved) {
      toast.error(
        `Fill in ${tokenValidation.unresolvedTokens.join(' and ')} before downloading`,
        TOAST_POSITION,
      )
      return
    }
    exportPDF.mutate(variation, {
      onError: () => toast.error('Failed to export PDF', TOAST_POSITION),
    })
  }

  const handleVariationLabelUpdate = async (
    targetTemplate: CoverLetterTemplate,
    label: string,
  ) => {
    const nextLabel = getCoverLetterLabelValue(label)
    if (!nextLabel || nextLabel === targetTemplate.label) return

    setSavingLabelVariation(targetTemplate.variation)
    try {
      await updateLabel.mutateAsync({
        variation: targetTemplate.variation,
        label: nextLabel,
      })
    } catch (error) {
      toast.error('Failed to rename cover letter', TOAST_POSITION)
      throw error
    } finally {
      setSavingLabelVariation(null)
    }
  }

  const handleTitleBlur = (input: HTMLInputElement) => {
    if (!template) return
    const nextLabel = getCoverLetterLabelValue(input.value)
    if (!nextLabel) {
      input.value = template.label
      return
    }
    if (nextLabel === template.label) return

    void handleVariationLabelUpdate(template, nextLabel).catch(() => {
      input.value = template.label
    })
  }

  const openUploader = (targetVariation: string | null) => {
    uploadTargetRef.current = targetVariation
    uploadInputRef.current?.click()
  }

  const handleCreateEmptyVariation = async () => {
    setUploadingVariation('new')
    try {
      const data = await createVariation.mutateAsync({
        label: COVER_LETTER_FALLBACK_LABEL,
      })
      // The variation-switch effect loads the (empty) content for the new key.
      setSearchParams({ v: data.variation }, { replace: true })
      toast.success(`${data.label} created`, TOAST_POSITION)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create variation'
      toast.error(msg, TOAST_POSITION)
    } finally {
      setUploadingVariation(null)
    }
  }

  const handleFileSelected = (file: File) => {
    const targetVariation = uploadTargetRef.current
    const targetTemplate =
      targetVariation === null
        ? undefined
        : sortedTemplates.find((item) => item.variation === targetVariation)

    // Confirm when uploading would overwrite an existing file or existing editor
    // content (saved or unsaved) — only a truly empty slot uploads directly.
    const hasContent =
      targetVariation === variation
        ? !isEditorEmpty
        : Boolean(targetTemplate?.content)
    const wouldOverwrite =
      Boolean(targetTemplate) &&
      (Boolean(targetTemplate?.file_url) || hasContent)

    if (wouldOverwrite) {
      setPendingAction({ type: 'upload', variation: targetVariation, file })
    } else {
      void handleVariationUpload(targetVariation, file)
    }
  }

  const handleConfirmAction = () => {
    if (!pendingAction) return
    if (pendingAction.type === 'upload') {
      void handleVariationUpload(pendingAction.variation, pendingAction.file)
    } else if (pendingAction.type === 'remove') {
      void handleRemove(pendingAction.template)
    } else if (pendingAction.type === 'restore') {
      handleRestore()
    }
    setPendingAction(null)
  }

  const requestRemove = (targetTemplate: CoverLetterTemplate) =>
    setPendingAction({ type: 'remove', template: targetTemplate })
  const requestRestore = () => setPendingAction({ type: 'restore' })

  const isUploading = uploadingVariation !== null
  const isRemoving = removingVariation !== null
  const downloadDisabled =
    tokensLoading || templatesLoading || hasUnresolved || isEditorEmpty

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
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
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
              isRestoring={restoreMutation.isPending}
              isDownloading={exportPDF.isPending}
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
              <EditorToolbar editor={editor} />
              {isDirty && (
                <span className="mr-3 text-[14px] text-destructive/60">
                  Unsaved changes
                </span>
              )}
              <Button
                className="mr-4 ml-auto px-8 hover:cursor-pointer"
                onClick={handleSave}
                disabled={updateContent.isPending || !template}
              >
                {updateContent.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden border-r border-border-subtle bg-surface-editor">
              <EditorCanvas
                isLoading={
                  templatesLoading ||
                  restoreMutation.isPending ||
                  uploadingVariation !== null ||
                  deleteTemplate.isPending
                }
                editor={editor}
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
            setSearchParams({ v: nextVariation }, { replace: true })
          }
          onVariationRename={handleVariationRename}
          onRequestUpload={() => openUploader(template ? variation : null)}
          onRequestAddVariation={() => openUploader(null)}
          onRequestCreateEmpty={handleCreateEmptyVariation}
          onRequestRemove={requestRemove}
          onRequestRestore={requestRestore}
          onDownload={handleDownload}
          role={role}
          company={company}
          onRoleChange={(v) => {
            setRole(v)
            scheduleTokenSave(v, company)
          }}
          onCompanyChange={(v) => {
            setCompany(v)
            scheduleTokenSave(role, v)
          }}
          onTokenBlur={handleTokenBlur}
          isRestoring={restoreMutation.isPending}
          isDownloading={exportPDF.isPending}
          isUploading={isUploading}
          uploadingVariation={uploadingVariation}
          removingVariation={removingVariation}
          savingLabelVariation={savingLabelVariation}
          isRemoving={isRemoving}
          isEditorEmpty={isEditorEmpty}
          isLoadingTokens={tokensLoading}
          isLoadingTemplates={templatesLoading}
          isRoleUnresolved={tokenValidation.isRoleUnresolved}
          isCompanyUnresolved={tokenValidation.isCompanyUnresolved}
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
    </div>
  )
}
