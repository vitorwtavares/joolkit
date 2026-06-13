import type { LegalDoc } from '../types'
import { LEGAL_INFO, contactLink } from '../info'

export const termsEn: LegalDoc = {
  title: 'Terms of Service',
  effectiveDate: LEGAL_INFO.effectiveDate.en,
  intro: [
    "These terms are the agreement between you and joolkit. We've kept them readable on purpose: joolkit helps you do your own job applications faster, and these terms explain what you can expect from us and what we expect from you.",
    'By creating an account or using joolkit, you agree to these terms and to our Privacy Policy.',
  ],
  sections: [
    {
      heading: '1. Who we are',
      blocks: [
        {
          kind: 'p',
          text: `joolkit is operated by **${LEGAL_INFO.companyName}**, a company registered in Brazil under CNPJ **${LEGAL_INFO.cnpj}** ("joolkit", "we", "us").`,
        },
      ],
    },
    {
      heading: '2. Eligibility and your account',
      blocks: [
        {
          kind: 'p',
          text: `You must be at least 18 years old, or otherwise have the legal capacity to enter a contract. You're responsible for keeping your login secure and for everything that happens under your account. Tell us at ${contactLink} if you notice unauthorized use.`,
        },
      ],
    },
    {
      heading: '3. What joolkit does',
      blocks: [
        {
          kind: 'p',
          text: 'joolkit is a workspace for managing your own job applications: quick-copy personal details, cover-letter templates with token replacement and PDF export, a reusable answer bank, and an application tracker. Usage of these features is subject to your plan limits, as shown on our pricing page. joolkit is not a job board, does not apply to jobs for you, and does not generate application content with AI — you stay in control of your own writing.',
        },
      ],
    },
    {
      heading: '4. Your content',
      blocks: [
        {
          kind: 'p',
          text: "You own everything you create or upload in joolkit. We don't claim ownership of it. You grant us only the limited license needed to store, process, and display your content so that we can provide the service to you. You're responsible for the content you put in and for having the right to use it.",
        },
      ],
    },
    {
      heading: '5. Acceptable use',
      blocks: [
        { kind: 'p', text: 'Please don’t use joolkit to:' },
        {
          kind: 'list',
          items: [
            'break the law or infringe someone else’s rights;',
            'upload malware or harmful code;',
            'try to break, overload, scrape, or reverse-engineer the service;',
            'resell or offer joolkit to third parties as a hosted or managed service (see our licence); or',
            'harm, harass, or deceive others.',
          ],
        },
        {
          kind: 'p',
          text: 'We may suspend or limit accounts that do any of the above.',
        },
      ],
    },
    {
      heading: '6. Plans, billing, and renewals',
      blocks: [
        { kind: 'sub', text: 'Free and Pro' },
        {
          kind: 'p',
          text: 'joolkit offers a Free plan and a paid Pro plan. Free has usage limits; Pro raises them. Current features and prices are shown on our pricing page.',
        },
        { kind: 'sub', text: 'Payment and renewal' },
        {
          kind: 'p',
          text: 'Pro is a recurring subscription billed through Stripe on the interval you choose (for example, monthly or quarterly). It renews automatically at the end of each period until you cancel. Prices are shown before you pay; if we change prices, the new price applies from your next renewal.',
        },
        { kind: 'sub', text: 'Cancelling and refunds' },
        {
          kind: 'p',
          text: "You can cancel anytime from your billing settings. When you cancel, you keep Pro until the end of the period you've already paid for, then move to Free — we don't charge again, and we don't pro-rate refunds for the unused part of a period.",
        },
        {
          kind: 'p',
          text: `**Right of withdrawal:** because joolkit is sold online, under Article 49 of the Brazilian Consumer Defense Code (CDC) you may cancel a new purchase within 7 days and receive a full refund. Email ${contactLink} within 7 days of buying to use this right.`,
        },
        { kind: 'sub', text: 'Downgrades' },
        {
          kind: 'p',
          text: "If you move from Pro to Free and you're over the Free limits, your extra items aren't deleted — they're safely stored and hidden, and are restored if you upgrade again.",
        },
      ],
    },
    {
      heading: '7. Availability and changes',
      blocks: [
        {
          kind: 'p',
          text: "We work to keep joolkit running well, but we don't promise it will always be available or error-free. We may add, change, or remove features over time. If we plan to discontinue the service, we'll give reasonable notice so you can export your data.",
        },
      ],
    },
    {
      heading: '8. Intellectual property',
      blocks: [
        {
          kind: 'p',
          text: 'The joolkit name, brand, and software belong to us or our licensors. The source code is made available under the [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license) — you may view and learn from it, but you may not offer it as a hosted or managed service. These terms give you no rights to our trademarks.',
        },
      ],
    },
    {
      heading: '9. Disclaimer',
      blocks: [
        {
          kind: 'p',
          text: 'joolkit is provided "as is" and "as available", without warranties of any kind to the extent permitted by law. We don\'t guarantee any particular outcome from using it — for example, getting a job or an interview.',
        },
      ],
    },
    {
      heading: '10. Limitation of liability',
      blocks: [
        {
          kind: 'p',
          text: "To the maximum extent permitted by law, joolkit won't be liable for indirect, incidental, or consequential damages, or for lost data, profits, or opportunities. Our total liability for any claim relating to the service is limited to the amount you paid us for it in the 12 months before the claim. Nothing here limits liability that can't be limited by law, including your rights under the Brazilian Consumer Defense Code.",
        },
      ],
    },
    {
      heading: '11. Termination',
      blocks: [
        {
          kind: 'p',
          text: 'You can stop using joolkit and delete your account at any time. We may suspend or end your access if you break these terms or the law. When an account ends, your data is handled as described in the Privacy Policy.',
        },
      ],
    },
    {
      heading: '12. Governing law and disputes',
      blocks: [
        {
          kind: 'p',
          text: `These terms are governed by the laws of Brazil. If you're a consumer, you may bring disputes in the courts of your own place of residence, as guaranteed by the Brazilian Consumer Defense Code. We'd always rather sort things out directly first — email ${contactLink}.`,
        },
      ],
    },
    {
      heading: '13. Changes to these terms',
      blocks: [
        {
          kind: 'p',
          text: 'We may update these terms. We\'ll change the "effective date" above and, for material changes, notify you where appropriate. Continuing to use joolkit means you accept the updated terms.',
        },
      ],
    },
    {
      heading: '14. Contact',
      blocks: [
        {
          kind: 'p',
          text: `Reach us at ${contactLink}. Operator: **${LEGAL_INFO.companyName}**, CNPJ **${LEGAL_INFO.cnpj}**, Brazil.`,
        },
      ],
    },
  ],
}
