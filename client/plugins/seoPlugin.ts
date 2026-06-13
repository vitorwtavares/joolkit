import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { LANDING_SEO, landingJsonLd } from '../src/seo/landingMeta'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function landingHeadTags() {
  const { title, description, url, ogImage } = LANDING_SEO
  const jsonLd = JSON.stringify(landingJsonLd())

  return `<title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="joolkit" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <script type="application/ld+json">${jsonLd}</script>`
}

function appHeadTags() {
  return `<title>joolkit</title>
    <meta name="robots" content="noindex, nofollow" />`
}

function landingRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${LANDING_SEO.url}/sitemap.xml
`
}

function landingSitemapXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${LANDING_SEO.url}/</loc>
  </url>
</urlset>
`
}

function appRobotsTxt() {
  return `User-agent: *
Disallow: /
`
}

export function seoPlugin(): Plugin {
  const isLandingSite = process.env.VITE_SITE === 'landing'

  return {
    name: 'joolkit-seo',
    transformIndexHtml(html) {
      const tags = isLandingSite ? landingHeadTags() : appHeadTags()
      return html.replace('<!-- seo -->', tags)
    },
    closeBundle() {
      const outDir = path.resolve(process.cwd(), 'dist')
      fs.mkdirSync(outDir, { recursive: true })

      fs.writeFileSync(
        path.join(outDir, 'robots.txt'),
        isLandingSite ? landingRobotsTxt() : appRobotsTxt(),
        'utf8',
      )

      if (isLandingSite) {
        fs.writeFileSync(
          path.join(outDir, 'sitemap.xml'),
          landingSitemapXml(),
          'utf8',
        )
      }
    },
  }
}
