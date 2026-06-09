import { useEffect, useState } from 'react'
import { useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Toggle } from '@/components/ui/toggle'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eye,
  Clipboard,
} from 'lucide-react'

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Verdana',
  'Georgia',
  'Times New Roman',
]
const FONT_SIZE_PRESETS = [
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '18',
  '24',
  '30',
  '36',
  '48',
  '72',
]

interface FontSizeInputProps {
  editor: Editor
  activeSize: string
  disabled?: boolean
}

const MAX_FONT_SIZE = 72

function FontSizeInput({ editor, activeSize, disabled }: FontSizeInputProps) {
  const [inputVal, setInputVal] = useState(activeSize)
  const [open, setOpen] = useState(false)
  const [showMaxHint, setShowMaxHint] = useState(false)

  // Sync input when editor selection changes (e.g. cursor moves to different-sized text)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputVal(activeSize)
  }, [activeSize])

  const apply = (val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) {
      if (n > MAX_FONT_SIZE) {
        setInputVal(String(MAX_FONT_SIZE))
        editor.chain().focus().setFontSize(`${MAX_FONT_SIZE}pt`).run()
        setShowMaxHint(true)
        setTimeout(() => setShowMaxHint(false), 2000)
      } else {
        editor.chain().focus().setFontSize(`${n}pt`).run()
      }
    } else {
      setInputVal(activeSize) // revert invalid input
    }
    setOpen(false)
  }

  return (
    <TooltipProvider>
      <Tooltip open={showMaxHint}>
        <TooltipTrigger asChild>
          <div className="relative ml-1 flex h-8 w-[52px] items-center rounded-md border border-border-subtle bg-secondary shadow-none focus-within:border-brand-border has-[:disabled]:opacity-50">
            <input
              id="cover-letter-font-size"
              name="cover-letter-font-size"
              disabled={disabled}
              className="w-full bg-transparent px-1.5 text-center text-sm text-foreground outline-none disabled:pointer-events-none"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => apply(inputVal)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  apply(inputVal)
                } else if (e.key === 'Escape') {
                  setInputVal(activeSize)
                  setOpen(false)
                  editor.commands.focus()
                }
              }}
            />
            {open && (
              <div className="absolute top-full left-0 z-50 mt-1 max-h-[200px] min-w-full overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md">
                {FONT_SIZE_PRESETS.map((s) => (
                  <div
                    key={s}
                    className="cursor-pointer px-3 py-1 text-sm text-popover-foreground hover:bg-accent"
                    onMouseDown={(e) => {
                      e.preventDefault() // keep input focused so blur doesn't fire first
                      setInputVal(s)
                      apply(s)
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">Max size: {MAX_FONT_SIZE}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface EditorToolbarProps {
  editor: Editor | null
  isPreview: boolean
  onTogglePreview: () => void
  onCopy: () => void
}

export function EditorToolbar({
  editor,
  isPreview,
  onTogglePreview,
  onCopy,
}: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          activeFamily: 'Helvetica',
          activeSize: '12',
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isLeft: false,
          isCenter: false,
          isRight: false,
          isJustify: false,
        }
      }
      const fontFamily =
        (ctx.editor.getAttributes('textStyle').fontFamily as
          | string
          | undefined) ??
        (ctx.editor.getAttributes('paragraph').fontFamily as string | undefined)
      const fontSize =
        (ctx.editor.getAttributes('textStyle').fontSize as
          | string
          | undefined) ??
        (ctx.editor.getAttributes('paragraph').fontSize as string | undefined)
      return {
        activeFamily: fontFamily?.replace(/['"]/g, '') || 'Helvetica',
        activeSize: fontSize?.replace(/px|pt/g, '') || '12',
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isUnderline: ctx.editor.isActive('underline'),
        isLeft: ctx.editor.isActive({ textAlign: 'left' }),
        isCenter: ctx.editor.isActive({ textAlign: 'center' }),
        isRight: ctx.editor.isActive({ textAlign: 'right' }),
        isJustify: ctx.editor.isActive({ textAlign: 'justify' }),
      }
    },
  })

  if (!editor || !state) return null

  const {
    activeFamily,
    activeSize,
    isBold,
    isItalic,
    isUnderline,
    isLeft,
    isCenter,
    isRight,
    isJustify,
  } = state

  const toolToggleClass =
    'size-7 min-w-7 rounded-md text-muted-foreground aria-pressed:bg-surface-selected aria-pressed:text-foreground'

  return (
    <div className="flex flex-1 items-center gap-0.5 px-3.5 py-2">
      <Select
        value={activeFamily}
        disabled={isPreview}
        onValueChange={(v) =>
          editor
            .chain()
            .focus()
            .setFontFamily(v)
            .updateAttributes('paragraph', { fontFamily: v })
            .run()
        }
      >
        <SelectTrigger
          size="sm"
          className="w-[112px] gap-1 rounded-md border-border-subtle bg-secondary px-2 text-sm text-foreground shadow-none hover:border-border hover:bg-secondary dark:bg-secondary dark:hover:bg-secondary"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4} align="start">
          {FONT_FAMILIES.map((f) => (
            <SelectItem
              key={f}
              value={f}
              className="text-sm"
              style={{ fontFamily: f }}
            >
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FontSizeInput
        editor={editor}
        activeSize={activeSize}
        disabled={isPreview}
      />

      <div className="mx-1.5 h-[18px] w-px bg-border-subtle" />

      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isUnderline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-3.5" />
      </Toggle>

      <div className="mx-1.5 h-[18px] w-px bg-border-subtle" />

      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isLeft}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('left').run()
        }
      >
        <AlignLeft className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isCenter}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('center').run()
        }
      >
        <AlignCenter className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isRight}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('right').run()
        }
      >
        <AlignRight className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className={toolToggleClass}
        disabled={isPreview}
        pressed={isJustify}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign('justify').run()
        }
      >
        <AlignJustify className="size-3.5" />
      </Toggle>

      <div className="mx-1.5 h-[18px] w-px bg-border-subtle" />

      <Toggle
        size="sm"
        className="h-7 gap-1.5 rounded-md px-2 text-muted-foreground aria-pressed:bg-surface-selected aria-pressed:text-foreground"
        pressed={isPreview}
        onPressedChange={onTogglePreview}
        aria-label="Toggle export preview"
        title="Preview export"
      >
        <Eye className="size-3.5" />
        <span className="text-sm">Preview</span>
      </Toggle>

      <div className="mx-1.5 h-[18px] w-px bg-border-subtle" />

      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Clipboard className="size-3.5" />
        <span className="text-sm">Copy</span>
      </button>
    </div>
  )
}
