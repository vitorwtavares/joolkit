import { Router } from 'express'
import puppeteer from 'puppeteer'
import { getSupabase, AuthRequest } from '../middleware/auth'
import { tiptapToHtml, TiptapDoc, Tokens } from '../utils/tiptapToHtml'

const router = Router()

// POST /api/export/cover-letter/:variation
router.post('/cover-letter/:variation', async (req: AuthRequest, res) => {
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      padding: 2.5cm 2.5cm;
    }
    p { margin-bottom: 0.8em; }
    h1, h2, h3, h4, h5, h6 { margin-bottom: 0.5em; }
    ul, ol { margin-bottom: 0.8em; padding-left: 1.5em; }
    li { margin-bottom: 0.2em; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`

  let browser
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
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
  } finally {
    await browser?.close()
  }
})

export default router
