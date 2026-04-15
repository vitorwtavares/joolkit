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
      onClick={() => editor?.commands.focus()}
    >
      <div
        className="mx-auto rounded-[4px]"
        style={{
          width: '794px',
          height: '1123px',
          background: '#1e1e1c',
          boxShadow:
            '0px 0px 10px 4px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.06)',
        }}
      >
        <EditorContent editor={editor} className="px-[100px] py-[80px]" />
      </div>
    </div>
  )
}
