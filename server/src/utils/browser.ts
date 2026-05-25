import { existsSync } from 'fs'
import type { Browser, LaunchOptions, PuppeteerNode } from 'puppeteer-core'

let _browser: Browser | null = null

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

async function getPuppeteer(): Promise<PuppeteerNode> {
  const { default: puppeteer } = await import('puppeteer-core')
  return puppeteer
}

function getLocalExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  return LOCAL_CHROME_PATHS.find((path) => existsSync(path))
}

async function getLaunchOptions(
  puppeteer: PuppeteerNode,
): Promise<LaunchOptions> {
  if (process.env.VERCEL) {
    const { default: chromium } = await import('@sparticuz/chromium')
    const headless = 'shell'
    return {
      args: await puppeteer.defaultArgs({ args: chromium.args, headless }),
      executablePath: await chromium.executablePath(),
      headless,
    }
  }

  return {
    args: ['--no-sandbox'],
    executablePath: getLocalExecutablePath(),
    headless: true,
  }
}

export async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser
  const puppeteer = await getPuppeteer()
  _browser = await puppeteer.launch(await getLaunchOptions(puppeteer))
  return _browser
}
