// Single source of truth for the legal/company details used across the Privacy
// Policy and Terms of Service, in both languages. Fill in the placeholders below
// before publishing — they only need to be set here.
export const LEGAL_INFO = {
  // Registered legal name of the operating company.
  companyName: 'SSC DESENVOLVIMENTO LTDA',
  // Brazilian company registration number.
  cnpj: '44707387/0001-96',
  // Contact address for support, privacy requests, and legal notices.
  contactEmail: 'contact@joolkit.com',
  // Date the current version of the documents takes effect. Update both formats
  // (same date, localised) whenever the Privacy Policy or Terms change.
  effectiveDate: {
    en: 'June 13, 2026',
    pt: '13 de junho de 2026',
  },
} as const

// Convenience markdown link to the contact email, used throughout the documents.
export const contactLink = `[${LEGAL_INFO.contactEmail}](mailto:${LEGAL_INFO.contactEmail})`
