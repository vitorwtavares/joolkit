import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { getBrowser } from '../utils/browser'
import { getSupabase, AuthRequest } from '../middleware/auth'
import { tiptapToHtml, TiptapDoc, Tokens } from '../utils/tiptapToHtml'

const router = Router()

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).userId
    if (!userId) throw new Error('pdfLimiter reached before authMiddleware')
    return userId
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'PDF export limit reached. Try again in an hour.' },
})

// POST /api/export/cover-letter/:variation
router.post(
  '/cover-letter/:variation',
  pdfLimiter,
  async (req: AuthRequest, res) => {
    const { variation } = req.params
    if (variation !== 'formal' && variation !== 'light') {
      res.status(400).json({ error: 'variation must be formal or light' })
      return
    }

    const supabase = getSupabase()

    const [
      { data: template, error: templateError },
      { data: tokens, error: tokensError },
    ] = await Promise.all([
      supabase
        .from('cover_letter_templates')
        .select('content')
        .eq('user_id', req.userId!)
        .eq('variation', variation)
        .maybeSingle(),
      supabase
        .from('cover_letter_tokens')
        .select('role, company')
        .eq('user_id', req.userId!)
        .maybeSingle(),
    ])

    if (templateError) {
      res.status(500).json({ error: templateError.message })
      return
    }

    if (!template?.content) {
      res.status(404).json({ error: 'cover letter content not found' })
      return
    }

    if (tokensError) {
      res.status(500).json({ error: tokensError.message })
      return
    }

    const resolvedTokens: Tokens = {
      role: tokens?.role ?? null,
      company: tokens?.company ?? null,
    }

    const bodyHtml = tiptapToHtml(template.content as TiptapDoc, resolvedTokens)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,400;1,700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Raleway:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.15;
      color: #000;
      padding: 2.5cm 2.5cm;
    }
    p { margin: 0; }
    h1, h2, h3, h4, h5, h6 { margin: 0; }
    ul, ol { margin: 0; padding-left: 1.5em; }
    li { margin: 0; }
    a { color: #0563C1; text-decoration: underline; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`

    let page
    try {
      const browser = await getBrowser()
      page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cover-letter-${variation}.pdf"`,
      )
      res.send(Buffer.from(pdf))
    } catch (err) {
      res.status(500).json({ error: 'PDF generation failed' })
    } finally {
      await page?.close()
    }
  },
)

export default router
