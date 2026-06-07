type TiptapMark = {
  type: string
  attrs?: Record<string, string | null>
}

type TiptapNode = {
  type: string
  attrs?: Record<string, string | null>
  marks?: TiptapMark[]
  content?: TiptapNode[]
  text?: string
}

export type TiptapDoc = TiptapNode

export type Tokens = Record<string, string | null | undefined>

const TOKEN_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

export function normalizeTokenKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function applyTokens(text: string, tokens: Tokens): string {
  return text.replace(TOKEN_PATTERN, (token, key: string) => {
    const value = tokens[normalizeTokenKey(key)]
    return value?.trim() ? value : token
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function marksToHtml(text: string, marks: TiptapMark[]): string {
  let result = text
  const styleProps: string[] = []
  let linkHref: string | null = null

  for (const mark of marks) {
    if (mark.type === 'bold') {
      result = `<strong>${result}</strong>`
    } else if (mark.type === 'italic') {
      result = `<em>${result}</em>`
    } else if (mark.type === 'underline') {
      result = `<u>${result}</u>`
    } else if (mark.type === 'textStyle') {
      if (mark.attrs?.fontFamily)
        styleProps.push(`font-family: ${mark.attrs.fontFamily}`)
      if (mark.attrs?.fontSize) {
        styleProps.push(`font-size: ${mark.attrs.fontSize}`)
      }
      if (mark.attrs?.color) styleProps.push(`color: ${mark.attrs.color}`)
    } else if (mark.type === 'link') {
      linkHref = String(mark.attrs?.href ?? '#')
    }
  }

  if (styleProps.length > 0) {
    result = `<span style="${styleProps.join('; ')}">${result}</span>`
  }

  if (linkHref !== null) {
    result = `<a href="${escapeHtml(linkHref)}" style="color: #0563C1; text-decoration: underline;">${result}</a>`
  }

  return result
}

function nodeToHtml(node: TiptapNode, tokens: Tokens): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => nodeToHtml(n, tokens)).join('')

    case 'paragraph': {
      const inner = (node.content ?? [])
        .map((n) => nodeToHtml(n, tokens))
        .join('')
      const align = node.attrs?.textAlign
      const styleProps: string[] = []
      if (align && align !== 'left') styleProps.push(`text-align: ${align}`)
      // An empty line has no text mark to carry its font, so it lives on the
      // paragraph node — apply it here so blank-line height matches the editor.
      if (!inner) {
        if (node.attrs?.fontFamily)
          styleProps.push(`font-family: ${node.attrs.fontFamily}`)
        if (node.attrs?.fontSize)
          styleProps.push(`font-size: ${node.attrs.fontSize}`)
      }
      const style = styleProps.length ? ` style="${styleProps.join('; ')}"` : ''
      return `<p${style}>${inner || '<br>'}</p>\n`
    }

    case 'heading': {
      const level = node.attrs?.level ?? '1'
      const align = node.attrs?.textAlign
      const style =
        align && align !== 'left' ? ` style="text-align: ${align}"` : ''
      const inner = (node.content ?? [])
        .map((n) => nodeToHtml(n, tokens))
        .join('')
      return `<h${level}${style}>${inner}</h${level}>\n`
    }

    case 'bulletList':
      return `<ul>\n${(node.content ?? []).map((n) => nodeToHtml(n, tokens)).join('')}</ul>\n`

    case 'orderedList':
      return `<ol>\n${(node.content ?? []).map((n) => nodeToHtml(n, tokens)).join('')}</ol>\n`

    case 'listItem': {
      const inner = (node.content ?? [])
        .map((n) => nodeToHtml(n, tokens))
        .join('')
      return `<li>${inner}</li>\n`
    }

    case 'hardBreak':
      return '<br>'

    case 'text': {
      const raw = escapeHtml(applyTokens(node.text ?? '', tokens))
      if (node.marks && node.marks.length > 0) {
        return marksToHtml(raw, node.marks)
      }
      return raw
    }

    default:
      return (node.content ?? []).map((n) => nodeToHtml(n, tokens)).join('')
  }
}

export function tiptapToHtml(doc: TiptapDoc, tokens: Tokens): string {
  return nodeToHtml(doc, tokens)
}
