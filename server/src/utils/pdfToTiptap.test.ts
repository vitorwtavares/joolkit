import { describe, expect, it } from 'vitest'
import { buildDocFromSegments, type Segment } from './pdfToTiptap'

function segment(text: string, y: number): Segment {
  return {
    text,
    x: 72,
    y,
    h: 12,
    bold: false,
    italic: false,
    fontFamily: null,
    link: null,
    width: 300,
    page: 1,
  }
}

describe('buildDocFromSegments', () => {
  it('preserves a visible blank line between PDF paragraphs', () => {
    const doc = buildDocFromSegments([
      segment('First paragraph wraps', 120),
      segment('onto a second line.', 106),
      segment('Second paragraph.', 78),
    ])

    expect(doc.content).toHaveLength(3)
    expect(doc.content[0].content?.map((node) => node.text).join('')).toBe(
      'First paragraph wraps onto a second line.',
    )
    expect(doc.content[1]).toEqual({ type: 'paragraph' })
    expect(doc.content[2].content?.map((node) => node.text).join('')).toBe(
      'Second paragraph.',
    )
  })

  it('preserves blank lines when most PDF text blocks are single-line paragraphs', () => {
    const doc = buildDocFromSegments([
      segment('Hello team,', 120),
      segment('I am interested in the role.', 92),
      segment('Best regards,', 64),
    ])

    expect(doc.content).toHaveLength(5)
    expect(doc.content[1]).toEqual({ type: 'paragraph' })
    expect(doc.content[3]).toEqual({ type: 'paragraph' })
  })
})
