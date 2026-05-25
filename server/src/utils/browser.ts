import chromium from '@sparticuz/chromium'
import { existsSync } from 'fs'
import puppeteer, { type Browser, type LaunchOptions } from 'puppeteer-core'

let _browser: Browser | null = null

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

function getLocalExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  return LOCAL_CHROME_PATHS.find((path) => existsSync(path))
}

async function getLaunchOptions(): Promise<LaunchOptions> {
  if (process.env.VERCEL) {
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
  _browser = await puppeteer.launch(await getLaunchOptions())
  return _browser
}
