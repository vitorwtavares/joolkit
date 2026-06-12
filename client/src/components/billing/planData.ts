import { PLAN_LIMITS } from '@joolkit/billing/plans'
import type {
  BillingInterval,
  CappedResource,
  DisplayCurrency,
} from '@/api/hooks/useBilling'

interface IntervalPricing {
  amount: string
  per: string
  sub: string
  badge?: string
}

interface CurrencyPricingConfig {
  symbol: string
  monthly: number
  // Total charged every 3 months on the quarterly plan (Stripe Price amount).
  quarterly: number
}

// Base prices for the upgrade modal. Per-month quarterly headline, sub-line, and
// save badge are derived from `monthly` and `quarterly`. Stripe finalises
// currency at checkout from the card country.
const PRO_PRICING_CONFIG: Record<DisplayCurrency, CurrencyPricingConfig> = {
  usd: { symbol: '$', monthly: 7, quarterly: 15 },
  brl: { symbol: 'R$', monthly: 24, quarterly: 57 },
}

function formatPrice(symbol: string, amount: number): string {
  return `${symbol}${amount}`
}

function quarterlyDiscountPercent(
  monthlyPerMonth: number,
  quarterlyPerMonth: number,
): number {
  return Math.round(
    ((monthlyPerMonth - quarterlyPerMonth) / monthlyPerMonth) * 100,
  )
}

function buildIntervalPricing(
  config: CurrencyPricingConfig,
): Record<BillingInterval, IntervalPricing> {
  const { symbol, monthly, quarterly } = config
  const quarterlyPerMonth = quarterly / 3
  const discount = quarterlyDiscountPercent(monthly, quarterlyPerMonth)

  return {
    monthly: {
      amount: formatPrice(symbol, monthly),
      per: '/ month',
      sub: 'Billed monthly',
    },
    quarterly: {
      amount: formatPrice(symbol, quarterlyPerMonth),
      per: '/ month',
      sub: `Billed quarterly · ${formatPrice(symbol, quarterly)} every 3 months`,
      badge: `Save ${discount}%`,
    },
  }
}

export const PRO_PRICING: Record<
  DisplayCurrency,
  Record<BillingInterval, IntervalPricing>
> = {
  usd: buildIntervalPricing(PRO_PRICING_CONFIG.usd),
  brl: buildIntervalPricing(PRO_PRICING_CONFIG.brl),
}

const free = PLAN_LIMITS.free
const pro = PLAN_LIMITS.pro

// Free-plan caps while billing status loads. Conservative on first paint so
// free users never see a briefly permissive UI; Pro users may get a positive
// surprise once status arrives. Server is always the runtime backstop.
export const FREE_CEILINGS: Record<CappedResource, number | null> = {
  applications: free.applications,
  answers: free.answers,
  resumeVariations: free.resumeVariations,
  coverLetterVariations: free.coverLetterVariations,
  tokenDefinitions: free.tokenDefinitions,
}

export const FREE_COVER_LETTER_VARIATION_LIMIT = free.coverLetterVariations
export const FREE_RESUME_VARIATION_LIMIT = free.resumeVariations

export const PRO_FEATURES = [
  `${pro.applications} tracked applications`,
  `${pro.answers} saved answers`,
  `${pro.coverLetterVariations} cover-letter variations`,
  `${pro.resumeVariations} resume variations`,
  pro.tokenDefinitions === null
    ? 'Unlimited custom tokens'
    : `${pro.tokenDefinitions} custom tokens`,
  `${pro.pdfExportsPerDay} PDF exports / day`,
  'Early access to every new feature',
] as const

// Singular/plural nouns used in upgrade prompts and hidden-data notices.
export const RESOURCE_NOUNS: Record<
  CappedResource,
  { singular: string; plural: string }
> = {
  applications: { singular: 'application', plural: 'applications' },
  answers: { singular: 'answer', plural: 'answers' },
  resumeVariations: {
    singular: 'resume variation',
    plural: 'resume variations',
  },
  coverLetterVariations: {
    singular: 'cover-letter variation',
    plural: 'cover-letter variations',
  },
  tokenDefinitions: { singular: 'token', plural: 'tokens' },
}
