export const LANDING_ORIGIN = 'https://joolkit.com'

export const LANDING_SEO = {
  title: 'joolkit — the job application toolkit',
  description:
    'A desktop-first workspace that takes the repetitive work out of job applications — without writing for you. Quick Copy, cover letters, answer bank, and an application tracker.',
  url: LANDING_ORIGIN,
  ogImage: `${LANDING_ORIGIN}/og-image.png`,
} as const

export function landingJsonLd() {
  const { description, url } = LANDING_SEO

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'joolkit',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Quick Copy for application forms',
      'Cover letter editor',
      'Answer bank',
      'Application tracker',
    ],
  }
}
