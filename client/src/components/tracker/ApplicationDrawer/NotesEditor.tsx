import { useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from '@tiptap/markdown'
import { NotesToolbar } from './NotesToolbar'
import type { Application } from '@/api/hooks/useApplications'
import type { CreateApplicationPayload } from '@/api/hooks/useApplications'

const NOTES_DEBOUNCE_MS = 1500

interface NotesEditorProps {
  app: Application
  save: (fields: CreateApplicationPayload) => void
}

export function NotesEditor({ app, save }: NotesEditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function flush(
    editor: import('@tiptap/react').Editor,
    saveFn: (fields: CreateApplicationPayload) => void = save,
  ) {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const markdown = editor.getMarkdown()
    saveFn({ notes: markdown || null })
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExt.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    content: app.notes ?? '',
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const markdown = editor.getMarkdown()
      const saveFn = save
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        saveFn({ notes: markdown || null })
      }, NOTES_DEBOUNCE_MS)
    },
    onBlur: ({ editor }) => flush(editor, save),
  })

  // Sync content when the app changes (e.g. drawer switches to a different row)
  const lastAppIdRef = useRef(app.id)
  useEffect(() => {
    if (!editor || app.id === lastAppIdRef.current) return
    lastAppIdRef.current = app.id
    editor.commands.setContent(app.notes ?? '', {
      emitUpdate: false,
      contentType: 'markdown',
    })
  }, [editor, app.id, app.notes])

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center border-b border-border-subtle px-16 py-2">
        <NotesToolbar editor={editor} />
      </div>

      {/* Editor area */}
      <div
        className="notes-editor cursor-text px-16 py-4"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
