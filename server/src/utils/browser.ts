import puppeteer, { type Browser } from 'puppeteer'

let _browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser
  _browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_BIN,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })
  return _browser
}
