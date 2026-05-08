const { join } = require('path')

/**
 * Keep the Puppeteer browser cache inside the deployed app so the Chrome
 * binary downloaded during install is still available at runtime on Render.
 *
 * See: https://pptr.dev/guides/configuration
 * See: https://pptr.dev/troubleshooting#could-not-find-expected-browser-locally
 *
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
}
