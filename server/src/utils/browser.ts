import puppeteer, { type Browser } from 'puppeteer'

let _browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser
  _browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  return _browser
}
