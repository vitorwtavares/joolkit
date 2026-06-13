const MARKETING_ORIGIN = 'https://joolkit.com'

export function legalUrl(path: '/privacy' | '/terms') {
  return `${MARKETING_ORIGIN}${path}`
}
