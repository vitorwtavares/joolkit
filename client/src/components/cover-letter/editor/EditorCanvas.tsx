import { Loader2 } from 'lucide-react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import type { ReactNode } from 'react'

interface EditorCanvasProps {
  isLoading: boolean
  editor: Editor | null
  previewEditor: Editor | null
  isPreview: boolean
  emptyState?: ReactNode
}

export function EditorCanvas({
  isLoading,
  editor,
  previewEditor,
  isPreview,
  emptyState,
}: EditorCanvasProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (emptyState) {
    return (
      <div className="editor-canvas flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        {emptyState}
      </div>
    )
  }

  return (
    <div
      className={`editor-canvas min-h-0 flex-1 overflow-y-auto py-5 ${
        isPreview ? 'cursor-default' : 'cursor-text'
      }`}
      onClick={(event) => {
        if (isPreview) return
        if ((event.target as Element).closest('[data-token-key]')) return
        editor?.commands.focus()
      }}
    >
      <div
        className="mx-auto rounded-md border border-border-subtle"
        style={{
          width: '794px',
          minHeight: '1123px',
          background: 'var(--card)',
          boxShadow: 'var(--canvas-shadow)',
        }}
      >
        {isPreview ? (
          <EditorContent
            editor={previewEditor}
            className="px-[100px] py-[80px] [&_.ProseMirror]:pointer-events-none [&_.ProseMirror]:cursor-default [&_.ProseMirror]:select-none"
          />
        ) : (
          <EditorContent editor={editor} className="px-[100px] py-[80px]" />
        )}
      </div>
    </div>
  )
}
