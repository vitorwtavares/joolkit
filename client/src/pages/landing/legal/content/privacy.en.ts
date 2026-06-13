import type { LegalDoc } from '../types'
import { LEGAL_INFO, contactLink } from '../info'

export const privacyEn: LegalDoc = {
  title: 'Privacy Policy',
  effectiveDate: LEGAL_INFO.effectiveDate.en,
  intro: [
    'We built joolkit to take the busywork out of job applications — not to harvest your data. This policy explains, in plain language, what we collect, why, and the control you have over it.',
    "The short version: we only store what's needed to run the product, we never sell your data, you can delete your account and everything in it at any time, and you can request a copy of your data whenever you like.",
  ],
  sections: [
    {
      heading: '1. Who we are',
      blocks: [
        {
          kind: 'p',
          text: `joolkit is operated by **${LEGAL_INFO.companyName}**, a company registered in Brazil under CNPJ **${LEGAL_INFO.cnpj}** ("joolkit", "we", "us").`,
        },
        {
          kind: 'p',
          text: `For any privacy question, or to exercise your rights, contact us at ${contactLink}. We respond within 15 days, as required by Brazil's General Data Protection Law (LGPD).`,
        },
      ],
    },
    {
      heading: '2. What we collect',
      blocks: [
        { kind: 'sub', text: 'Information you give us' },
        {
          kind: 'list',
          items: [
            '**Account details** — your email address and password. Passwords are stored encrypted by our authentication provider; we never see them in plain text.',
            '**Profile and Quick Copy details** — anything you choose to save for reuse: your name, email, phone, address, links (LinkedIn, GitHub, portfolio, other), and résumé files you upload.',
            '**Your job-application content** — cover letter templates and variations, reusable answers, tracker entries (company and role names, statuses, notes, deadlines, skills, locations), and any tokens you define.',
          ],
        },
        { kind: 'sub', text: 'Payment information' },
        {
          kind: 'p',
          text: 'When you subscribe to Pro, payment is processed by Stripe. joolkit never receives or stores your full card number. We store only billing metadata returned by Stripe — a customer and subscription identifier, your plan, status, billing interval, currency, and renewal date.',
        },
        { kind: 'sub', text: 'Information collected automatically' },
        {
          kind: 'p',
          text: "To keep the service secure and working, we process basic technical data such as your IP address — used, for example, to show prices in your local currency and to rate-limit abusive requests — and standard server logs. As of the effective date above, we don't use third-party analytics, advertising, or behavioral-tracking tools; if that changes, we'll update this policy (including the Cookies section below) first.",
        },
      ],
    },
    {
      heading: '3. Why we use your data, and our legal basis',
      blocks: [
        {
          kind: 'p',
          text: 'We process your data to: provide and operate the features you use (performance of our contract with you); process payments and manage your subscription (contract); keep the service secure and prevent abuse (legitimate interest); comply with legal obligations; and respond to your requests. Where the law requires your consent, we ask for it first.',
        },
      ],
    },
    {
      heading: '4. Cookies',
      blocks: [
        {
          kind: 'p',
          text: "We use only essential cookies needed to keep you signed in and to operate the service. We don't currently use advertising or analytics cookies. If we introduce analytics to better understand how our site is used, we'll update this section — and ask for your consent first wherever the law requires it.",
        },
      ],
    },
    {
      heading: '5. Who we share it with',
      blocks: [
        {
          kind: 'p',
          text: 'We don\'t sell your personal data, and we don\'t share it for advertising. We rely on a small number of trusted providers ("sub-processors") strictly to run joolkit:',
        },
        {
          kind: 'list',
          items: [
            '**Supabase** — database, authentication, and file storage (hosts your account and content).',
            '**Stripe** — payment processing and subscription billing.',
            '**Vercel** — application hosting and content delivery.',
          ],
        },
        {
          kind: 'p',
          text: 'These providers process data on our behalf under their own security and privacy commitments. We may also disclose data if required by law or to protect our rights and our users.',
        },
      ],
    },
    {
      heading: '6. International data transfers',
      blocks: [
        {
          kind: 'p',
          text: 'Our providers may store and process data on servers outside Brazil (for example, in the United States). When that happens, we rely on the transfer safeguards those providers offer and on the legal bases permitted under the LGPD and, where applicable, the GDPR.',
        },
      ],
    },
    {
      heading: '7. How long we keep it',
      blocks: [
        {
          kind: 'p',
          text: 'We keep your data for as long as your account is active. If you delete your account, we delete your personal data and uploaded files from our systems — except where we must retain limited records to meet legal, tax, or accounting obligations.',
        },
      ],
    },
    {
      heading: '8. Your rights',
      blocks: [
        {
          kind: 'p',
          text: `Under the LGPD (and the GDPR where it applies) you can: access the data we hold about you; correct inaccurate data; delete your data; export a copy; object to or restrict certain processing; and withdraw consent where processing is based on it. You can do most of this yourself in the app, or email ${contactLink} and we will help within 15 days. You also have the right to complain to Brazil’s data protection authority (ANPD).`,
        },
      ],
    },
    {
      heading: '9. Security',
      blocks: [
        {
          kind: 'p',
          text: 'We protect your data with encryption in transit, access controls, and reputable infrastructure providers. No system is perfectly secure, but we work to keep your information safe and will notify you and the authorities of a breach where the law requires.',
        },
      ],
    },
    {
      heading: '10. Children',
      blocks: [
        {
          kind: 'p',
          text: "joolkit isn't directed at children. You must be at least 18 years old, or otherwise have the legal capacity to enter a contract, to use it.",
        },
      ],
    },
    {
      heading: '11. Changes to this policy',
      blocks: [
        {
          kind: 'p',
          text: 'If we make material changes, we\'ll update this page and the "effective date" above, and notify you where appropriate. Continuing to use joolkit after a change means you accept the updated policy.',
        },
      ],
    },
    {
      heading: '12. Contact',
      blocks: [
        {
          kind: 'p',
          text: `Questions, requests, or concerns? Email ${contactLink}. Controller: **${LEGAL_INFO.companyName}**, CNPJ **${LEGAL_INFO.cnpj}**, Brazil.`,
        },
      ],
    },
  ],
}
