// On the marketing site (VITE_SITE=landing), auth routes live on the app's
// own domain; everywhere else (the app itself, local dev) they're same-origin.
const APP_ORIGIN =
  import.meta.env.VITE_SITE === 'landing' ? 'https://app.joolkit.com' : ''

export function appUrl(path: string) {
  return `${APP_ORIGIN}${path}`
}
