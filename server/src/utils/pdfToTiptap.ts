/* eslint-disable @typescript-eslint/no-explicit-any */

import { pathToFileURL } from 'url'

// pdfjs-dist v5 is ESM-only; use a lazy dynamic import() in this CommonJS project.
let _pdfjsLib: any = null

async function ensurePdfjsDomGlobals() {
  if ('DOMMatrix' in globalThis) return

  const { DOMMatrix, ImageData, Path2D } = await import('@napi-rs/canvas')
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D })
}

async function getPdfjs() {
  if (!_pdfjsLib) {
    await ensurePdfjsDomGlobals()
    _pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    _pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
      require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
    ).href
  }
  return _pdfjsLib
}

// ── Types ────────────────────────────────────────────────────────────────────

type Mark = { type: string; attrs?: Record<string, unknown> }
type TextNode = { type: 'text'; text: string; marks?: Mark[] }
type ParagraphNode = { type: 'paragraph'; content?: TextNode[] }
type TiptapDoc = { type: 'doc'; content: ParagraphNode[] }

interface Segment {
  text: string
  x: number
  y: number
  h: number // font height in points
  bold: boolean
  italic: boolean
  fontFamily: string | null
  link: string | null
  width: number
  page: number
}

interface FontMeta {
  bold: boolean
  italic: boolean
  fontFamily: string | null
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function pdfToTiptap(buffer: Buffer): Promise<TiptapDoc> {
  const pdfjsLib = await getPdfjs()
  let pdf: any
  try {
    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      useWorkerFetch: false,
      useWasm: false,
    }).promise
  } catch (err) {
    throw new Error(
      `Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  try {
    const segments: Segment[] = []

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)

      // getOperatorList triggers font loading into page.commonObjs as a side
      // effect. If pdfjs ever stops doing this, resolveFontMeta will silently
      // fall back to CSS heuristics and bold/italic detection may degrade.
      // getAnnotations fetches link annotations. Run all three in parallel.
      const [tc, , rawAnnotations] = await Promise.all([
        page.getTextContent({ includeMarkedContent: false }),
        page.getOperatorList(),
        page.getAnnotations(),
      ])

      // Collect URI link annotations for this page: [{url, rect:[x1,y1,x2,y2]}]
      const pageLinks = (rawAnnotations as any[])
        .filter((a: any) => a.subtype === 'Link' && a.url)
        .map((a: any) => ({ url: a.url as string, rect: a.rect as number[] }))

      // Build font metadata map — primary source is the font descriptor stored in
      // page.commonObjs (has reliable `bold` / `italic` booleans set by pdfjs from
      // the /FontDescriptor). Fall back to font name heuristics if unavailable.
      const fontMeta: Record<string, FontMeta> = {}
      for (const fontName of Object.keys(
        tc.styles as Record<string, unknown>,
      )) {
        fontMeta[fontName] = resolveFontMeta(page, tc, fontName)
      }

      for (const raw of tc.items as any[]) {
        if (!('str' in raw) || !raw.str) continue
        const meta = fontMeta[raw.fontName] ?? {
          bold: false,
          italic: false,
          fontFamily: null,
        }

        const sx = raw.transform[4] as number
        const sy = raw.transform[5] as number
        const sw = raw.width as number

        // Check if this segment's horizontal midpoint falls within a link annotation
        const matchedLink = pageLinks.find((l) => {
          const [x1, y1, x2, y2] = l.rect
          const midX = sx + sw / 2
          return (
            midX >= x1 - 1 && midX <= x2 + 1 && sy >= y1 - 1 && sy <= y2 + 1
          )
        })

        segments.push({
          text: raw.str as string,
          x: sx,
          y: sy,
          h: Math.abs(raw.height as number) || 0,
          bold: meta.bold,
          italic: meta.italic,
          fontFamily: meta.fontFamily,
          link: matchedLink?.url ?? null,
          width: sw,
          page: p,
        })
      }
    }

    if (segments.length === 0) {
      return { type: 'doc', content: [{ type: 'paragraph' }] }
    }

    return buildDoc(segments)
  } catch (err) {
    throw new Error(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`,
    )
  } finally {
    await pdf.destroy()
  }
}

// ── Font metadata resolution ──────────────────────────────────────────────────

// Only fonts the editor toolbar lists and the PDF export can reliably render.
// Anything else returns null so the document default (Helvetica) applies.
const FONT_FAMILY_LOOKUP: Record<string, string> = {
  arial: 'Arial',
  arialmt: 'Arial',
  helvetica: 'Helvetica',
  helveticaneue: 'Helvetica',
  verdana: 'Verdana',
  georgia: 'Georgia',
  timesnewroman: 'Times New Roman',
  timesnewromanps: 'Times New Roman',
  timesnewromanpsmt: 'Times New Roman',
  times: 'Times New Roman',
  timesroman: 'Times New Roman',
}

function normalizeFontFamily(psName: string): string | null {
  // Strip embedded-subset prefix (six uppercase letters followed by '+')
  const noPrefix = psName.replace(/^[A-Z]{6}\+/, '')
  // Strip weight/style suffix after the first hyphen
  const base = noPrefix.replace(
    /-(?:Bold|Italic|BoldItalic|Regular|Medium|Light|Thin|Black|Heavy|SemiBold|DemiBold|Oblique|BoldOblique|Narrow|Condensed|Extended|Roman|Pro|MT|PS|PSMT|Cyr|Std)[\w]*$/i,
    '',
  )
  const key = base.toLowerCase().replace(/[^a-z0-9]/g, '')
  return FONT_FAMILY_LOOKUP[key] ?? null
}

function resolveFontMeta(page: any, tc: any, fontName: string): FontMeta {
  // 1. Try the font descriptor data pdfjs stores in commonObjs
  try {
    if (page.commonObjs.has(fontName)) {
      const data = page.commonObjs.get(fontName) as any
      if (data) {
        const psName: string = data.name ?? ''
        return {
          bold: data.bold === true || /bold/i.test(psName),
          italic: data.italic === true || /italic|oblique/i.test(psName),
          fontFamily: psName ? normalizeFontFamily(psName) : null,
        }
      }
    }
  } catch {
    // commonObjs not available or not resolved yet — fall through
  }

  // 2. Fallback: inspect the CSS fontFamily string pdfjs built for rendering
  const ff: string = (tc.styles as any)[fontName]?.fontFamily ?? ''
  return {
    bold: /bold/i.test(ff),
    italic: /italic|oblique/i.test(ff),
    fontFamily: null, // pdfjs CSS fontFamily strings are unreliable for family detection
  }
}

// ── Document reconstruction ───────────────────────────────────────────────────

function buildDoc(segments: Segment[]): TiptapDoc {
  // Sort: page asc → y desc (PDF origin is bottom-left) → x asc
  segments.sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x)

  // ── Cluster into lines (items within 2pt on the same y) ─────────────────
  const lines: Segment[][] = []
  let curLine: Segment[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const s = segments[i]
    if (s.page === curLine[0].page && Math.abs(s.y - curLine[0].y) <= 2) {
      curLine.push(s)
    } else {
      lines.push(curLine)
      curLine = [s]
    }
  }
  lines.push(curLine)

  // ── Compute actual line gaps to derive real line spacing ────────────────
  const lineGaps: number[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i][0].page === lines[i - 1][0].page) {
      const gap = lines[i - 1][0].y - lines[i][0].y
      if (gap > 0) lineGaps.push(gap)
    }
  }
  lineGaps.sort((a, b) => a - b)
  // Median gap = normal line spacing in this document
  const medLineGap = lineGaps[Math.floor(lineGaps.length / 2)] || 14

  // A gap larger than 1.5× the normal line spacing signals a new paragraph.
  const PARA_GAP = medLineGap * 1.5

  // ── Compute text right margin for "short line" detection ────────────────
  // A line that ends well before the document's max right edge is an intentional
  // break (header, signature, list item), not a natural word-wrap.
  const lineRights = lines.map((line) => {
    const last = line[line.length - 1]
    return last.x + last.width
  })
  const maxRight = Math.max(...lineRights)
  const minLeft = Math.min(...lines.map((line) => line[0].x))
  // Trigger a paragraph break when the previous line leaves more than 25% of
  // the text width unused on the right.
  const SHORT_LINE_SLACK = (maxRight - minLeft) * 0.25

  // ── Cluster lines into paragraphs ────────────────────────────────────────
  const paraGroups: Segment[][][] = []
  let curPara: Segment[][] = [lines[0]]

  for (let i = 1; i < lines.length; i++) {
    const prevY = curPara[curPara.length - 1][0].y
    const currY = lines[i][0].y
    const prevPage = curPara[curPara.length - 1][0].page
    const currPage = lines[i][0].page
    const gap = prevY - currY

    const prevLine = curPara[curPara.length - 1]
    const prevLastSeg = prevLine[prevLine.length - 1]
    const prevRightEdge = prevLastSeg.x + prevLastSeg.width
    const isShortLine = maxRight - prevRightEdge > SHORT_LINE_SLACK

    // Font-height guard: a gap > 2.5× the previous line's font height is always
    // a paragraph break. This handles sparse documents (few lines, single-line
    // paragraphs) where medLineGap ends up being a paragraph-level gap itself,
    // making PARA_GAP too large to detect any break.
    const prevLineMaxH = Math.max(...prevLine.map((s) => s.h), 0)
    const isLargeGap = prevLineMaxH > 0 && gap > prevLineMaxH * 2.5

    if (currPage !== prevPage || gap > PARA_GAP || isShortLine || isLargeGap) {
      paraGroups.push(curPara)
      // Insert an empty paragraph for a visible blank line (no text item in PDF).
      // Use whichever threshold fires first: medLineGap ratio for dense docs,
      // or 3× font height for sparse docs.
      const isBlankLine =
        currPage === prevPage &&
        (gap > medLineGap * 1.8 || (prevLineMaxH > 0 && gap > prevLineMaxH * 3))
      if (isBlankLine) {
        // Count how many blank lines this gap represents. Clamp normalSpacing to
        // font height so medLineGap doesn't over-count in sparse documents.
        const normalSpacing =
          prevLineMaxH > 0
            ? Math.min(medLineGap, prevLineMaxH * 1.6)
            : medLineGap
        const numBlanks = Math.max(1, Math.round(gap / normalSpacing) - 1)
        for (let b = 0; b < numBlanks; b++) paraGroups.push([])
      }
      curPara = [lines[i]]
    } else {
      curPara.push(lines[i])
    }
  }
  paraGroups.push(curPara)

  // ── Convert each paragraph group into a TipTap paragraph node ───────────
  const content = paraGroups.map(linesToParagraph)

  // Trim leading/trailing empty paragraphs
  let start = 0
  let end = content.length - 1
  while (start <= end && !content[start].content?.length) start++
  while (end >= start && !content[end].content?.length) end--

  return { type: 'doc', content: content.slice(start, end + 1) }
}

function linesToParagraph(lines: Segment[][]): ParagraphNode {
  const nodes: TextNode[] = []

  for (let li = 0; li < lines.length; li++) {
    // Lines within the same paragraph are PDF-wrapped lines of the same
    // logical sentence — join them with a single space.
    if (li > 0) appendText(nodes, ' ', [])

    const line = lines[li]
    for (let si = 0; si < line.length; si++) {
      const seg = line[si]
      const marks = marksFor(seg)

      // Insert a space between items when there is a visible horizontal gap
      const prev = line[si - 1]
      if (prev && seg.x - (prev.x + prev.width) > seg.h * 0.2) {
        appendText(nodes, ' ', [])
      }

      appendText(nodes, seg.text, marks)
    }
  }

  if (nodes.length === 0) return { type: 'paragraph' }
  return { type: 'paragraph', content: nodes }
}

// ── Mark helpers ──────────────────────────────────────────────────────────────

function marksFor(seg: Segment): Mark[] {
  const marks: Mark[] = []
  if (seg.bold) marks.push({ type: 'bold' })
  if (seg.italic) marks.push({ type: 'italic' })

  // textStyle: bundle fontSize and fontFamily into a single mark
  const styleAttrs: Record<string, unknown> = {}
  if (seg.h > 0) styleAttrs.fontSize = `${Math.round(seg.h)}pt`
  if (seg.fontFamily) styleAttrs.fontFamily = seg.fontFamily
  if (Object.keys(styleAttrs).length > 0) {
    marks.push({ type: 'textStyle', attrs: styleAttrs })
  }

  if (seg.link) {
    marks.push({
      type: 'link',
      attrs: {
        href: seg.link,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    })
  }

  return marks
}

/** Append text to the node list, merging into the last node when marks match. */
function appendText(nodes: TextNode[], text: string, marks: Mark[]): void {
  if (!text) return
  const last = nodes[nodes.length - 1]
  if (last && marksEqual(last.marks ?? [], marks)) {
    last.text += text
  } else {
    const node: TextNode = { type: 'text', text }
    if (marks.length > 0) node.marks = marks
    nodes.push(node)
  }
}

function sortedStringify(obj: Record<string, unknown> | undefined): string {
  if (!obj) return ''
  return JSON.stringify(
    Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map((k) => [k, obj[k]]),
    ),
  )
}

function marksEqual(a: Mark[], b: Mark[]): boolean {
  if (a.length !== b.length) return false
  return a.every((ma, i) => {
    const mb = b[i]
    return (
      ma.type === mb.type &&
      sortedStringify(ma.attrs) === sortedStringify(mb.attrs)
    )
  })
}
