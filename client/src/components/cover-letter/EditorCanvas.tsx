import { Loader2 } from 'lucide-react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'

interface EditorCanvasProps {
  isLoading: boolean
  editor: Editor | null
}

export function EditorCanvas({ isLoading, editor }: EditorCanvasProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div
      className="editor-canvas min-h-0 flex-1 cursor-text overflow-y-auto py-5"
      onClick={(event) => {
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
        <EditorContent editor={editor} className="px-[100px] py-[80px]" />
      </div>
    </div>
  )
}
