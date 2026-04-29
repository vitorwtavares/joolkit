/**
 * Usage: pnpm screenshot [page1] [page2] ...
 *
 * Pages: quick-copy | cover-letter | answer-bank | tracker
 * Example: pnpm screenshot quick-copy tracker
 *
 * Requires client/.env.local with:
 *   SCREENSHOT_EMAIL=your@email.com
 *   SCREENSHOT_PASSWORD=yourpassword
 */

import { chromium } from 'playwright'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

function loadEnv(): Record<string, string> {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) {
    console.error(
      'Missing client/.env.local — create it with SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD',
    )
    process.exit(1)
  }
  const env: Record<string, string> = {}
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0) {
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key) env[key] = val
    }
  }
  return env
}

const ROUTES: Record<string, string> = {
  'quick-copy': '/quick-copy',
  'cover-letter': '/cover-letter',
  'answer-bank': '/answer-bank',
  tracker: '/tracker',
}

async function main() {
  const env = loadEnv()
  const email = env['SCREENSHOT_EMAIL']
  const password = env['SCREENSHOT_PASSWORD']

  if (!email || !password) {
    console.error(
      'SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD must be set in client/.env.local',
    )
    process.exit(1)
  }

  const pages = process.argv.slice(2).filter(Boolean)
  if (pages.length === 0) {
    console.error(
      `Specify at least one page: ${Object.keys(ROUTES).join(' | ')}`,
    )
    process.exit(1)
  }

  const invalid = pages.filter((p) => !ROUTES[p])
  if (invalid.length > 0) {
    console.error(
      `Unknown page(s): ${invalid.join(', ')}. Valid: ${Object.keys(ROUTES).join(', ')}`,
    )
    process.exit(1)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  console.log('Signing in…')
  await page.goto('http://localhost:5173/sign-in', { waitUntil: 'networkidle' })
  await page.waitForSelector('#email', { timeout: 15_000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), {
    timeout: 10_000,
  })
  console.log('Signed in.')

  for (const name of pages) {
    const route = ROUTES[name]
    console.log(`Screenshotting ${name}…`)
    await page.goto(`http://localhost:5173${route}`)
    await page.waitForLoadState('networkidle')
    if (name === 'tracker') {
      // Wait for real rows or empty state — ensures skeleton is gone before capturing
      await page
        .waitForSelector('tbody tr:not([data-skeleton])', { timeout: 10_000 })
        .catch(() => {})
    }
    const outPath = join(ROOT, 'screenshots', `${name}.png`)
    await page.screenshot({ path: outPath, fullPage: false })
    console.log(`  → screenshots/${name}.png`)
  }

  await browser.close()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
