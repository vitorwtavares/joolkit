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
      })
    }
  })
  return ranges
}

function buildDecorations(
  doc: Node,
  tokens: TokenValues,
  onTokenClick?: (key: string) => void,
): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: Node, pos: number) => {
    if (!node.isText || !node.text) return

    TOKEN_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = TOKEN_PATTERN.exec(node.text)) !== null) {
      const token = match[0]
      const key = normalizeTokenKey(match[1] ?? '')
      const from = pos + match.index
      const to = from + token.length
      const value = tokens[key]
      const isResolved = !!value?.trim()

      // Render the chip as a widget at `from` and hide the raw token text.
      // side: 1 → widget is drawn AFTER the caret at `from`, so the caret at
      // `from` sits to the LEFT of the chip, outside its outline/margin.
      // The raw "{{token}}" text in [from, to] is hidden via `token-hidden`.
      // An anchor widget at `to` with side: -1 forces the caret at `to` to
      // land AFTER a real inline box (a zero-width space with normal font
      // metrics), so the caret has non-zero height and is visible to the
      // RIGHT of the chip, outside its outline/margin.
      const displayText = key || 'token'
      const className = isResolved ? 'token-resolved' : 'token-unresolved'
      decorations.push(
        Decoration.widget(
          from,
          () => {
            const el = document.createElement('span')
            el.className = className
            el.dataset.tokenKey = displayText
            const open = document.createElement('span')
            open.textContent = '{{'
            const text = document.createElement('span')
            text.textContent = displayText
            text.style.display = 'inline-block'
            text.style.padding = '0 3px'
            const close = document.createElement('span')
            close.textContent = '}}'
            el.append(open, text, close)

            if (onTokenClick) {
              el.addEventListener('mousedown', (event) => {
                event.preventDefault()
                event.stopPropagation()
                onTokenClick(displayText)
              })
              el.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()
              })
            }

            return el
          },
          {
            side: 1,
            key: `token-widget-spaced-${from}-${displayText}-${isResolved ? 'resolved' : 'unresolved'}`,
          },
        ),
      )
      decorations.push(Decoration.inline(from, to, { class: 'token-hidden' }))
      decorations.push(
        Decoration.widget(
          to,
          () => {
            const el = document.createElement('span')
            el.className = 'token-caret-anchor'
            el.textContent = '\u200B'
            return el
          },
          { side: -1, key: `token-anchor-${to}` },
        ),
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
            return buildDecorations(state.doc, tokens, onTokenClick)
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

            if (event.key === 'Backspace') {
              for (const range of ranges) {
                if (from > range.from && from <= range.to) {
                  view.dispatch(view.state.tr.delete(range.from, range.to))
                  return true
                }
              }
            }

            if (event.key === 'Delete') {
              for (const range of ranges) {
                if (from >= range.from && from < range.to) {
                  view.dispatch(view.state.tr.delete(range.from, range.to))
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
