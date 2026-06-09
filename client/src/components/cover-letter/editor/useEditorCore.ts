import { useEffect, useRef, useState } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import type { SetURLSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  useUpdateCoverLetterContent,
  useRestoreCoverLetter,
  useExportCoverLetterPDF,
  type CoverLetterTemplate,
} from '@/api/hooks/useCoverLetters'
import { TokenHighlight, setTokenHighlight } from '../tokens/tokenHighlight'
import { getCoverLetterTokenValidation } from '../tokens/tokenValidation'
import {
  getTokenValueMap,
  normalizeTokenKey,
  substituteTokensInDoc,
  type EditableCoverLetterToken,
} from '../tokens/tokenUtils'
import {
  TOAST_POSITION,
  PageHeightLimit,
  ParagraphFontStyles,
} from './editorExtensions'

// Bridges token clicks from the TipTap plugin (which has no React context)
// to the React state handler registered in the effect below.
const editorTokenClickBridge: { current: (key: string) => void } = {
  current: () => {},
}

interface UseEditorCoreParams {
  requestedVariation: string | null
  setSearchParams: SetURLSearchParams
  template: CoverLetterTemplate | undefined
  variation: string
  templatesLoading: boolean
  tokens: EditableCoverLetterToken[]
  ensureTokenByKey: (key: string) => void
  flushTokenSaveAsync: () => Promise<void>
  tokensLoading: boolean
}

export function useEditorCore({
  requestedVariation,
  setSearchParams,
  template,
  variation,
  templatesLoading,
  tokens,
  ensureTokenByKey,
  flushTokenSaveAsync,
  tokensLoading,
}: UseEditorCoreParams) {
  const updateContent = useUpdateCoverLetterContent()
  const restoreMutation = useRestoreCoverLetter()
  const exportPDF = useExportCoverLetterPDF()

  const [isDirty, setIsDirty] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [focusTokenKey, setFocusTokenKey] = useState<string | null>(null)
  const lastVariation = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      ParagraphFontStyles,
      PageHeightLimit.configure({
        onPasteRejected: () => setIsDirty(false),
      }),
      TokenHighlight.configure({
        onTokenClick: (key) => editorTokenClickBridge.current(key),
      }),
    ],
    onUpdate: () => setIsDirty(true),
  })

  // Read-only mirror used for preview mode. Shares formatting extensions so
  // styles match, but drops token highlight and page-limit plugins — tokens
  // are substituted directly into its content.
  const previewEditor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      ParagraphFontStyles,
    ],
  })

  useEffect(() => {
    editorTokenClickBridge.current = (key: string) => {
      const normalized = normalizeTokenKey(key)
      if (!normalized) return
      editor?.commands.blur()
      const exists = tokens.some(
        (token) => normalizeTokenKey(token.key) === normalized,
      )
      if (!exists) ensureTokenByKey(normalized)
      setFocusTokenKey(normalized)
    }
  }, [editor, ensureTokenByKey, tokens])

  // Keep the URL ?v= param in sync with the resolved template when the
  // requested variation is missing or stale.
  useEffect(() => {
    if (templatesLoading) return
    if (!template) return
    if (requestedVariation === template.variation) return
    setSearchParams({ v: template.variation }, { replace: true })
  }, [requestedVariation, setSearchParams, template, templatesLoading])

  // Load content on mount and variation switch.
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

  // Sync token decorations whenever tokens change.
  useEffect(() => {
    if (!editor?.view) return
    setTokenHighlight(editor.view, getTokenValueMap(tokens))
  }, [editor, tokens])

  // Reset preview when switching variations.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPreview(false)
  }, [variation])

  // Refresh preview content when preview is toggled on or tokens change.
  useEffect(() => {
    if (!isPreview || !editor || !previewEditor) return
    const doc = substituteTokensInDoc(
      editor.getJSON(),
      getTokenValueMap(tokens),
    )
    previewEditor.commands.setContent(doc, { emitUpdate: false })
  }, [isPreview, editor, previewEditor, tokens])

  const { isEmpty: isEditorEmpty, text: editorText } = useEditorState({
    editor,
    selector: (ctx) => ({
      isEmpty: ctx.editor?.isEmpty ?? true,
      text: ctx.editor?.getText() ?? '',
    }),
  })

  const tokenValidation = getCoverLetterTokenValidation({
    text: editorText,
    tokens,
  })
  const hasUnresolved = tokenValidation.unresolvedTokens.length > 0
  const downloadDisabled =
    tokensLoading || templatesLoading || hasUnresolved || isEditorEmpty

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

  const handleCopyToClipboard = async () => {
    if (!editor || !previewEditor) return
    const doc = substituteTokensInDoc(
      editor.getJSON(),
      getTokenValueMap(tokens),
    )
    previewEditor.commands.setContent(doc, { emitUpdate: false })

    // Post-process HTML for cross-app paste compatibility (Google Docs, Word):
    // zero block margins to prevent host-app default spacing, and replace empty
    // paragraphs with &nbsp; so they retain line height without extra characters.
    // Full HTML wrapper needed for Google Docs to handle text/html faithfully.
    const rawHtml = previewEditor.getHTML()
    const domDoc = new DOMParser().parseFromString(rawHtml, 'text/html')
    for (const el of domDoc.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, ul, ol, li',
    )) {
      ;(el as HTMLElement).style.margin = '0'
      ;(el as HTMLElement).style.padding = '0'
    }
    for (const p of domDoc.querySelectorAll('p')) {
      if (!p.textContent?.trim()) p.innerHTML = '&nbsp;'
    }
    const html = `<html><head><meta charset="utf-8"></head><body>${domDoc.body.innerHTML}</body></html>`
    const text = previewEditor.getText({ blockSeparator: '\n' })

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      toast.success('Copied to clipboard', TOAST_POSITION)
    } catch {
      toast.error('Failed to copy to clipboard', TOAST_POSITION)
    }
  }

  const handleDownload = async () => {
    if (!variation) return
    if (hasUnresolved) {
      toast.error(
        `Fill in ${tokenValidation.unresolvedTokens.join(' and ')} before downloading`,
        TOAST_POSITION,
      )
      return
    }
    try {
      await flushTokenSaveAsync()
    } catch {
      toast.error('Failed to save tokens before downloading', TOAST_POSITION)
      return
    }
    exportPDF.mutate(variation, {
      onError: (error) =>
        toast.error(error.message || 'Failed to export PDF', TOAST_POSITION),
    })
  }

  return {
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
    isSaving: updateContent.isPending,
    isRestoring: restoreMutation.isPending,
    isDownloading: exportPDF.isPending,
  }
}
