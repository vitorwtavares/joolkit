import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'
import { normalizeTokenKey, TOKEN_PATTERN } from './tokenUtils'

type TokenValues = Record<string, string | null | undefined>

const pluginKey = new PluginKey<TokenValues>('tokenHighlight')

interface TokenRange {
  from: number
  to: number
  key: string
}

function findTokenRanges(doc: Node): TokenRange[] {
  const ranges: TokenRange[] = []
  doc.descendants((node: Node, pos: number) => {
    if (!node.isText || !node.text) return
    TOKEN_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = TOKEN_PATTERN.exec(node.text)) !== null) {
      ranges.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
        key: normalizeTokenKey(match[1] ?? '') || 'token',
      })
    }
  })
  return ranges
}

function buildDecorations(doc: Node, tokens: TokenValues): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: Node, pos: number) => {
    if (!node.isText || !node.text) return

    TOKEN_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = TOKEN_PATTERN.exec(node.text)) !== null) {
      const key = normalizeTokenKey(match[1] ?? '')
      const from = pos + match.index
      const to = from + match[0].length
      const value = tokens[key]
      const isResolved = !!value?.trim()

      // Style the raw "{{token}}" text in place as a chip. Keeping it as real
      // text (rather than a widget over hidden text) means it selects, deletes
      // and carries its font marks like any other text.
      decorations.push(
        Decoration.inline(from, to, {
          class: `token-chip ${isResolved ? 'token-chip-resolved' : 'token-chip-unresolved'}`,
          'data-token-key': key || 'token',
        }),
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

export const TokenHighlight = Extension.create<{
  onTokenClick?: (key: string) => void
}>({
  name: 'tokenHighlight',

  addOptions() {
    return { onTokenClick: undefined }
  },

  addProseMirrorPlugins() {
    const onTokenClick = this.options.onTokenClick

    return [
      new Plugin({
        key: pluginKey,

        state: {
          init() {
            return {} as TokenValues
          },
          apply(tr, prev) {
            const meta = tr.getMeta(pluginKey) as TokenValues | undefined
            return meta ?? prev
          },
        },

        props: {
          decorations(state) {
            const tokens = pluginKey.getState(state)!
            return buildDecorations(state.doc, tokens)
          },

          handleClick(view: EditorView, pos: number) {
            if (!onTokenClick) return false
            // Strict interior: a click resolving to `from`/`to` is the caret
            // spot just before/after the chip (e.g. clicking the line past a
            // token at line end), not a click on the token itself.
            for (const range of findTokenRanges(view.state.doc)) {
              if (pos > range.from && pos < range.to) {
                onTokenClick(range.key)
                return true
              }
            }
            return false
          },

          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const { selection, doc } = view.state
            if (!selection.empty) return false

            const { from } = selection
            const ranges = findTokenRanges(doc)

            if (event.key === 'ArrowLeft') {
              for (const range of ranges) {
                if (from > range.from && from <= range.to) {
                  view.dispatch(
                    view.state.tr.setSelection(
                      TextSelection.create(doc, range.from),
                    ),
                  )
                  return true
                }
              }
            }

            if (event.key === 'ArrowRight') {
              for (const range of ranges) {
                if (from >= range.from && from < range.to) {
                  view.dispatch(
                    view.state.tr.setSelection(
                      TextSelection.create(doc, range.to),
                    ),
                  )
                  return true
                }
              }
            }

            // When deleting a whole token, carry its marks (e.g. font size)
            // into the stored marks so an emptied line keeps its formatting
            // instead of snapping back to the editor default.
            const deleteToken = (range: TokenRange) => {
              const marks = doc.nodeAt(range.from)?.marks
              const tr = view.state.tr.delete(range.from, range.to)
              if (marks?.length) tr.setStoredMarks(marks)
              view.dispatch(tr)
            }

            if (event.key === 'Backspace') {
              for (const range of ranges) {
                if (from > range.from && from <= range.to) {
                  deleteToken(range)
                  return true
                }
              }
            }

            if (event.key === 'Delete') {
              for (const range of ranges) {
                if (from >= range.from && from < range.to) {
                  deleteToken(range)
                  return true
                }
              }
            }

            return false
          },
        },
      }),
    ]
  },
})

export function setTokenHighlight(view: EditorView, tokens: TokenValues) {
  view.dispatch(view.state.tr.setMeta(pluginKey, tokens))
}
