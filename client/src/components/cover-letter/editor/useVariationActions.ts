import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { User } from '@supabase/supabase-js'
import type { SetURLSearchParams } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import {
  useCreateCoverLetterVariation,
  useUpdateCoverLetterFile,
  useUpdateCoverLetterLabel,
  useDeleteCoverLetterTemplate,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { type PendingAction } from '../dialogs/CoverLetterConfirmDialog'
import {
  COVER_LETTER_FALLBACK_LABEL,
  getCoverLetterLabelValue,
  getCoverLetterTemplatePath,
} from '../variations/coverLetterVariationUtils'
import { TOAST_POSITION } from './editorExtensions'

interface UseVariationActionsParams {
  user: User | null
  editor: Editor | null
  variation: string
  template: CoverLetterTemplate | undefined
  sortedTemplates: CoverLetterTemplate[]
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  setSearchParams: SetURLSearchParams
  isEditorEmpty: boolean
  handleRestore: () => void
}

export function useVariationActions({
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
}: UseVariationActionsParams) {
  const createVariation = useCreateCoverLetterVariation()
  const updateFile = useUpdateCoverLetterFile()
  const updateLabel = useUpdateCoverLetterLabel()
  const deleteTemplate = useDeleteCoverLetterTemplate()

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
  const [pendingDiscard, setPendingDiscard] = useState<{
    run: () => void
  } | null>(null)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
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

  // Any action that switches away from (or replaces) the active variation runs
  // through here so unsaved edits prompt a discard confirmation first.
  const guardUnsavedChanges = (action: () => void) => {
    if (isDirty) {
      setPendingDiscard({ run: action })
      return
    }
    action()
  }

  const switchVariation = (target: string, focusTitle: boolean) => {
    if (focusTitle) pendingTitleFocus.current = true
    setSearchParams({ v: target }, { replace: true })
  }

  const requestVariationSwitch = (target: string, focusTitle = false) => {
    if (target === variation) {
      if (focusTitle) {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }
      return
    }
    guardUnsavedChanges(() => switchVariation(target, focusTitle))
  }

  const handleVariationRename = (targetTemplate: CoverLetterTemplate) =>
    requestVariationSwitch(targetTemplate.variation, true)

  const openUploader = (targetVariation: string | null) => {
    uploadTargetRef.current = targetVariation
    uploadInputRef.current?.click()
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

  const handleCreateEmptyVariation = async () => {
    setUploadingVariation('new')
    try {
      const data = await createVariation.mutateAsync({
        label: COVER_LETTER_FALLBACK_LABEL,
      })
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
      // A new-variation upload switches away from the active one — guard edits.
      guardUnsavedChanges(
        () => void handleVariationUpload(targetVariation, file),
      )
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

  const handleRequestCreateEmpty = () =>
    guardUnsavedChanges(() => void handleCreateEmptyVariation())

  return {
    uploadingVariation,
    removingVariation,
    savingLabelVariation,
    pendingAction,
    setPendingAction,
    pendingDiscard,
    setPendingDiscard,
    uploadInputRef,
    titleInputRef,
    isUploading: uploadingVariation !== null,
    isRemoving: removingVariation !== null,
    openUploader,
    handleVariationUpload,
    handleRemove,
    handleVariationLabelUpdate,
    handleTitleBlur,
    handleCreateEmptyVariation,
    handleFileSelected,
    handleConfirmAction,
    requestRemove,
    requestRestore,
    requestVariationSwitch,
    handleVariationRename,
    handleRequestCreateEmpty,
  }
}
