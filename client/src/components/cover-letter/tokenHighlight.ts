import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

export type TokenValues = {
  role: string | null
  company: string | null
}

const pluginKey = new PluginKey<TokenValues>('tokenHighlight')

const TOKEN_PATTERN = /\$ROLE\$|\$COMPANY\$/g

function buildDecorations(doc: Node, tokens: TokenValues): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: Node, pos: number) => {
    if (!node.isText || !node.text) return

    TOKEN_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = TOKEN_PATTERN.exec(node.text)) !== null) {
      const token = match[0]
      const from = pos + match.index
      const to = from + token.length
      const value = token === '$ROLE$' ? tokens.role : tokens.company
      const isResolved = !!value

      decorations.push(
        Decoration.inline(from, to, {
          class: isResolved ? 'token-resolved' : 'token-unresolved',
          ...(isResolved ? { 'data-value': value! } : {}),
        }),
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

export const TokenHighlight = Extension.create({
  name: 'tokenHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,

        state: {
          init() {
            return { role: null, company: null } as TokenValues
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
        },
      }),
    ]
  },
})

export function setTokenHighlight(view: EditorView, tokens: TokenValues) {
  view.dispatch(view.state.tr.setMeta(pluginKey, tokens))
}
