import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { toast } from 'sonner'

// Editor toasts sit bottom-center so they don't cover the header toolbar.
export const TOAST_POSITION = { position: 'bottom-center' } as const

const PAGE_CONTENT_HEIGHT = 1123 - 80 * 2
const MAX_PAGES = 3
const MAX_CONTENT_HEIGHT = PAGE_CONTENT_HEIGHT * MAX_PAGES

export const PageHeightLimit = Extension.create<{
  onPasteRejected?: () => void
}>({
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

// A textStyle mark only styles text, so an empty line — which has no text —
// loses its font size/family and collapses to the editor default. The
// paragraph node stores the active size/family (stamped below) so the empty
// line and caret can keep them.
export const ParagraphFontStyles = Extension.create({
  name: 'paragraphFontStyles',

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
          fontSize: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontSize || null,
            // Never rendered on the <p> directly — only via the decoration
            // below while the line is empty. Otherwise a stored size would
            // inflate a line whose text has since been made smaller.
            renderHTML: () => ({}),
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        // Stamp the active font size/family onto a paragraph once it becomes
        // empty, so the empty line and caret keep them.
        appendTransaction(_transactions, _oldState, newState) {
          const { selection, storedMarks } = newState
          if (!selection.empty) return null
          const { $from } = selection
          const paragraph = $from.parent
          if (paragraph.type.name !== 'paragraph' || paragraph.content.size > 0)
            return null
          const textStyle = (storedMarks ?? $from.marks()).find(
            (m) => m.type.name === 'textStyle',
          )
          const next = { ...paragraph.attrs }
          let changed = false
          for (const attr of ['fontSize', 'fontFamily'] as const) {
            const value = textStyle?.attrs[attr] as string | undefined
            if (value && next[attr] !== value) {
              next[attr] = value
              changed = true
            }
          }
          if (!changed) return null
          return newState.tr.setNodeMarkup($from.before(), undefined, next)
        },

        props: {
          // Apply the stored font size to the <p> only while it is empty, so a
          // line with text is always sized by its text spans instead.
          decorations(state) {
            const decorations: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (
                node.type.name === 'paragraph' &&
                node.content.size === 0 &&
                node.attrs.fontSize
              ) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    style: `font-size: ${node.attrs.fontSize}`,
                  }),
                )
              }
            })
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
