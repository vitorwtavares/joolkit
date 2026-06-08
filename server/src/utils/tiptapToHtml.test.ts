import { describe, expect, it } from 'vitest'
import { tiptapToHtml, type TiptapDoc } from './tiptapToHtml'

describe('tiptapToHtml', () => {
  it('substitutes user-defined cover letter tokens', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I am applying for {{ role }} at {{company}}.',
            },
          ],
        },
      ],
    }

    expect(
      tiptapToHtml(doc, {
        role: 'Senior Engineer',
        company: 'Joolkit',
      }),
    ).toContain('I am applying for Senior Engineer at Joolkit.')
  })

  it('escapes token values before rendering HTML', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello {{company}}' }],
        },
      ],
    }

    expect(tiptapToHtml(doc, { company: 'A&B <Co>' })).toContain(
      'Hello A&amp;B &lt;Co&gt;',
    )
  })

  it('leaves unresolved tokens in place', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello {{company}}' }],
        },
      ],
    }

    expect(tiptapToHtml(doc, {})).toContain('Hello {{company}}')
  })

  it('applies font size/family to an empty line but not to one with text', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { fontSize: '30pt', fontFamily: 'Georgia' },
        },
        {
          type: 'paragraph',
          attrs: { fontSize: '30pt' },
          content: [{ type: 'text', text: 'hi' }],
        },
      ],
    }

    const html = tiptapToHtml(doc, {})
    expect(html).toContain(
      '<p style="font-family: Georgia; font-size: 30pt"><br></p>',
    )
    expect(html).toContain('<p>hi</p>')
  })
})
