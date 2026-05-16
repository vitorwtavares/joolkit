import { useState, useRef } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Link,
  List,
  ListChecks,
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { sanitizeUrl } from '@/utils/sanitizeUrl'

const BTN = 'h-8 w-8 min-w-8 rounded-md'
const ICON = 'size-4'
const HEADING_ICON = 'size-[18px]'
const SEP = <div className="mx-1 h-[16px] w-px bg-border" />

interface NotesToolbarProps {
  editor: Editor | null
}

function LinkPopover({
  editor,
  hasSelection,
  isLinkActive,
}: {
  editor: Editor
  hasSelection: boolean
  isLinkActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function openPopover() {
    if (!hasSelection) {
      return
    }

    setUrl(editor.getAttributes('link').href ?? '')
    setOpen(true)
  }

  function handleApply() {
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      const sanitizedUrl = sanitizeUrl(url)
      if (!sanitizedUrl) {
        return
      }

      editor.chain().focus().setLink({ href: sanitizedUrl }).run()
    }
    setOpen(false)
  }

  function handleRemove() {
    editor.chain().focus().unsetLink().run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Toggle
          className={BTN}
          disabled={!hasSelection}
          pressed={isLinkActive}
          onMouseDown={(event) => event.preventDefault()}
          onClick={openPopover}
        >
          <Link className={ICON} />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2"
        align="start"
        onOpenAutoFocus={() => setTimeout(() => inputRef.current?.focus(), 0)}
      >
        <input
          ref={inputRef}
          name="tracker-notes-link-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply()
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder="https://..."
          className="mb-1.5 w-full rounded border border-input-border-strong bg-input-subtle px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex gap-1.5">
          {editor.isActive('link') && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
          <Button size="sm" className="flex-1" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function NotesToolbar({ editor }: NotesToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null
      return {
        isH1: ctx.editor.isActive('heading', { level: 1 }),
        isH2: ctx.editor.isActive('heading', { level: 2 }),
        isH3: ctx.editor.isActive('heading', { level: 3 }),
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isCode: ctx.editor.isActive('code'),
        isLink: ctx.editor.isActive('link'),
        isBulletList: ctx.editor.isActive('bulletList'),
        isTaskList: ctx.editor.isActive('taskList'),
        hasSelection: !ctx.editor.state.selection.empty,
      }
    },
  })

  if (!editor || !state) return null

  const {
    isH1,
    isH2,
    isH3,
    isBold,
    isItalic,
    isCode,
    isLink,
    isBulletList,
    isTaskList,
    hasSelection,
  } = state

  return (
    <div className="flex items-center gap-0.5">
      {/* Headings */}
      <Toggle
        className={BTN}
        pressed={isH1}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className={HEADING_ICON} />
      </Toggle>
      <Toggle
        className={BTN}
        pressed={isH2}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className={HEADING_ICON} />
      </Toggle>
      <Toggle
        className={BTN}
        pressed={isH3}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className={HEADING_ICON} />
      </Toggle>

      {SEP}

      {/* Inline formatting */}
      <Toggle
        size="sm"
        className={BTN}
        pressed={isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className={ICON} />
      </Toggle>
      <Toggle
        size="sm"
        className={BTN}
        pressed={isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className={ICON} />
      </Toggle>
      <Toggle
        size="sm"
        className={BTN}
        pressed={isCode}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className={ICON} />
      </Toggle>
      <LinkPopover
        editor={editor}
        hasSelection={hasSelection}
        isLinkActive={isLink}
      />

      {SEP}

      {/* Lists */}
      <Toggle
        size="sm"
        className={BTN}
        pressed={isBulletList}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className={ICON} />
      </Toggle>
      <Toggle
        size="sm"
        className={BTN}
        pressed={isTaskList}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks className={ICON} />
      </Toggle>
    </div>
  )
}
