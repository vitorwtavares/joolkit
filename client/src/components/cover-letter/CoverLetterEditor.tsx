import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import UnderlineExt from '@tiptap/extension-underline'
import FontFamily from '@tiptap/extension-font-family'
import FontSize from '@tiptap/extension-font-size'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { TOKEN_ROLE, TOKEN_COMPANY } from '@/constants'
import { TextStyle } from '@tiptap/extension-text-style'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import {
  useCoverLetters,
  useUpdateCoverLetterContent,
  useUpdateCoverLetterFile,
  useDeleteCoverLetterTemplate,
  useRestoreCoverLetter,
  useExportCoverLetterPDF,
} from '@/api/hooks/useCoverLetters'
import { useCoverLetterTokens } from '@/api/hooks/useCoverLetterTokens'
import { useTokenState } from '@/hooks/useTokenState'
import { TokenHighlight, setTokenHighlight } from './tokenHighlight'
import { EditorToolbar } from './EditorToolbar'
import { EditorSidePanel } from './EditorSidePanel'
import { VariationToggle } from './VariationToggle'
import { EditorCanvas } from './EditorCanvas'
import { EditorStatusBar } from './EditorStatusBar'

// Page is 1123px tall with 80px top/bottom padding — content must stay within that.
const MAX_CONTENT_HEIGHT = 1123 - 80 * 2

const PageHeightLimit = Extension.create({
  name: 'pageHeightLimit',

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
    return [
      new Plugin({
        props: {
          handlePaste: (view) => {
            const el = view.dom as HTMLElement
            if (el.scrollHeight >= MAX_CONTENT_HEIGHT) {
              toast.error('Page is full — remove some content before pasting')
              return true
            }
            // Allow paste, then check after the DOM updates
            requestAnimationFrame(() => {
              if ((view.dom as HTMLElement).scrollHeight > MAX_CONTENT_HEIGHT) {
                editor.commands.undo()
                toast.error(
                  'Pasted content exceeds the page limit and was removed',
                )
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

type Variation = 'formal' | 'light'

export function CoverLetterEditor() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const variation: Variation =
    searchParams.get('v') === 'light' ? 'light' : 'formal'
  const setVariation = (v: Variation) =>
    setSearchParams({ v }, { replace: true })
  const [isUploading, setIsUploading] = useState(false)

  const { data: tokenData, isLoading: tokensLoading } = useCoverLetterTokens()
  const {
    role,
    setRole,
    company,
    setCompany,
    scheduleTokenSave,
    flushTokenSave,
  } = useTokenState(tokenData)

  const { data: templates, isLoading: templatesLoading } = useCoverLetters()
  const template = templates?.find((t) => t.variation === variation)

  const updateContent = useUpdateCoverLetterContent()
  const updateFile = useUpdateCoverLetterFile()
  const deleteTemplate = useDeleteCoverLetterTemplate()
  const restoreMutation = useRestoreCoverLetter()
  const exportPDF = useExportCoverLetterPDF()

  const [isDirty, setIsDirty] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      UnderlineExt,
      TextStyle,
      FontFamily,
      FontSize,
      ParagraphFontFamily,
      PageHeightLimit,
      TokenHighlight,
    ],
    onUpdate: () => setIsDirty(true),
  })

  // Load content on mount and variation switch.
  // Wait for templates to finish loading before committing lastVariation so that
  // data arriving after the editor is ready doesn't get skipped.
  const lastVariation = useRef<Variation | null>(null)
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

  const { isEmpty: isEditorEmpty } = useEditorState({
    editor,
    selector: (ctx) => ({ isEmpty: ctx.editor?.isEmpty ?? true }),
  })

  const hasUnresolved = !role || !company

  const handleTokenBlur = () => flushTokenSave(role, company)

  const handleSave = () => {
    if (!editor) return
    updateContent.mutate(
      { variation, content: editor.getJSON() },
      {
        onSuccess: () => {
          setIsDirty(false)
          toast.success('Saved')
        },
      },
    )
  }

  const handleRestore = () => {
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

  const handleUpload = async (file: File) => {
    if (!user) return
    const path = `${user.id}/${variation}/${file.name}`
    setIsUploading(true)

    if (template?.file_url && template.file_url !== path) {
      await supabase.storage
        .from('cover-letters')
        .remove([template.file_url])
        .catch(() => {})
    }

    const { error: uploadError } = await supabase.storage
      .from('cover-letters')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setIsUploading(false)
      toast.error('Upload failed: ' + uploadError.message)
      return
    }

    updateFile.mutate(
      { variation, file_url: path },
      {
        onSuccess: (data) => {
          if (editor && data.content) {
            editor.commands.setContent(
              data.content as Record<string, unknown>,
              {
                emitUpdate: false,
              },
            )
            setIsDirty(false)
          }
          toast.success(
            `${variation.charAt(0).toUpperCase() + variation.slice(1)} template uploaded`,
          )
        },
        onError: () => toast.error('Failed to save file'),
        onSettled: () => setIsUploading(false),
      },
    )
  }

  const handleRemove = () => {
    deleteTemplate.mutate(variation, {
      onSuccess: () => {
        if (editor) {
          editor.commands.setContent(
            { type: 'doc', content: [] },
            { emitUpdate: false },
          )
          setIsDirty(false)
        }
        toast.success(
          `${variation.charAt(0).toUpperCase() + variation.slice(1)} template removed`,
        )
      },
      onError: () => toast.error('Failed to remove template'),
    })
  }

  const handleDownload = () => {
    if (hasUnresolved) {
      toast.error(
        `Fill in ${TOKEN_ROLE} and ${TOKEN_COMPANY} before downloading`,
      )
      return
    }
    exportPDF.mutate(variation, {
      onError: () => toast.error('Failed to export PDF'),
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex shrink-0 items-center px-[18px] py-3.5"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex min-w-40 flex-col gap-0.5">
          {templatesLoading ? (
            <Skeleton className="h-[14px] w-36" />
          ) : (
            <span className="text-[14px] leading-tight text-[#8a8a85]">
              {template?.file_url?.split('/').pop() ?? 'No file uploaded'}
            </span>
          )}
        </div>

        <div className="flex flex-1 justify-center">
          <VariationToggle variation={variation} onChange={setVariation} />
        </div>

        <div className="min-w-40" />
      </div>

      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div
            className="flex shrink-0"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex flex-1 items-center"
              style={{ borderRight: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              <EditorToolbar editor={editor} />
              {isDirty && (
                <span className="mr-3 text-[14px] text-destructive/60">
                  Unsaved changes
                </span>
              )}
              <Button
                className="mr-4 ml-auto px-8 hover:cursor-pointer"
                onClick={handleSave}
                disabled={updateContent.isPending}
              >
                {updateContent.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <div
              className="flex flex-1 flex-col overflow-hidden"
              style={{
                borderRight: '0.5px solid rgba(255,255,255,0.07)',
                background: '#111110',
              }}
            >
              <EditorCanvas
                isLoading={
                  templatesLoading ||
                  restoreMutation.isPending ||
                  isUploading ||
                  deleteTemplate.isPending
                }
                editor={editor}
              />
            </div>
          </div>
        </div>

        {/* Side panel */}
        <EditorSidePanel
          variation={variation}
          template={template}
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
          onRestore={handleRestore}
          onDownload={handleDownload}
          onUpload={handleUpload}
          onRemove={handleRemove}
          isRestoring={restoreMutation.isPending}
          isDownloading={exportPDF.isPending}
          isUploading={isUploading}
          isRemoving={deleteTemplate.isPending}
          isEditorEmpty={isEditorEmpty}
          isLoadingTokens={tokensLoading}
          isLoadingTemplates={templatesLoading}
        />
      </div>

      <EditorStatusBar hasUnresolved={hasUnresolved} />
    </div>
  )
}
