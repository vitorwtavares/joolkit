import { useState } from 'react'
import { appUrl } from '../appUrl'
import { CheckIcon } from '../icons'
import { useDisplayCurrency } from '../useDisplayCurrency'
import type { DisplayCurrency } from '../useDisplayCurrency'

// Mirrors the shipped paywall (client PRO_PRICING). `quarterlyTotal` is the amount
// charged every 3 months; per-month headline and savings are derived from it.
// Stripe makes the authoritative currency call from the card country at checkout.
interface CurrencyPricing {
  symbol: string
  // Spacing between symbol and amount ('R$ 19' reads better than 'R$19').
  gap: string
  monthly: number
  quarterlyTotal: number
}

const PRICING: Record<DisplayCurrency, CurrencyPricing> = {
  usd: { symbol: '$', gap: '', monthly: 7, quarterlyTotal: 15 },
  brl: { symbol: 'R$', gap: ' ', monthly: 24, quarterlyTotal: 57 },
}

const FREE_FEATURES = [
  'Unlimited Quick Copy usage',
  '50 tracked applications',
  '4 custom tokens',
  '1 cover-letter variation',
  '1 resume variation',
  'Answer Bank — searchable, tagged, up to 4 answers',
  '2 PDF exports / day',
]

const PRO_FEATURES = [
  '500 tracked applications',
  'Unlimited custom tokens',
  '10 cover-letter variations',
  '10 resume variations',
  'Answer Bank — searchable, tagged, up to 50 answers',
  '15 PDF exports / day',
  'Early access to every new feature',
]

export default function Pricing() {
  const [quarterly, setQuarterly] = useState(true)
  const currency = useDisplayCurrency()

  const { symbol, gap, monthly, quarterlyTotal } = PRICING[currency]
  const quarterlyPerMonth = quarterlyTotal / 3
  const savePercent = Math.round(
    ((monthly - quarterlyPerMonth) / monthly) * 100,
  )

  const proAmount = quarterly ? quarterlyPerMonth : monthly
  const proSub = quarterly
    ? `Billed quarterly · ${symbol}${gap}${quarterlyTotal} every 3 months`
    : 'Billed monthly'

  return (
    <section className="section" id="pricing">
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="section-head" style={{ marginBottom: 32 }}>
          <span className="kicker">Pricing</span>
          <h2>Transparent and fair.</h2>
          <p>
            Start free. Upgrade when your search gets serious. No long-term
            lock-in.
          </p>
        </div>
        <div className="price-toggle">
          <button
            className={!quarterly ? 'on' : ''}
            onClick={() => setQuarterly(false)}
          >
            Monthly
          </button>
          <button
            className={quarterly ? 'on' : ''}
            onClick={() => setQuarterly(true)}
          >
            Quarterly <span className="price-save">Save {savePercent}%</span>
          </button>
        </div>
        <div className="plan-grid">
          <div className="plan">
            <div className="plan-name">Free</div>
            <div className="plan-price">
              <span className="amt">
                {symbol}
                {gap}0
              </span>
              <span className="per">/ forever</span>
            </div>
            <div className="plan-sub">No card required</div>
            <div className="plan-desc">
              For getting your applications in order.
            </div>
            <ul className="plan-feats">
              {FREE_FEATURES.map((feature) => (
                <li key={feature}>
                  <CheckIcon size={18} color="var(--muted)" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              className="btn btn-ghost"
              style={{ marginTop: 'auto' }}
              href={appUrl('/sign-up')}
            >
              Try joolkit free
            </a>
          </div>
          <div className="plan pop">
            <div className="plan-name">
              Pro <span className="plan-badge">Best price</span>
            </div>
            <div className="plan-price">
              <span className="amt">
                {symbol}
                {gap}
                {proAmount}
              </span>
              <span className="per">/ month</span>
            </div>
            <div className="plan-sub">{proSub}</div>
            <div className="plan-desc">For an active, organized search.</div>
            <div className="plan-plus">All Free features, plus:</div>
            <ul className="plan-feats">
              {PRO_FEATURES.map((feature) => (
                <li key={feature}>
                  <CheckIcon size={18} color="var(--accent)" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              className="btn btn-primary"
              style={{ marginTop: 'auto' }}
              href={appUrl('/sign-up')}
            >
              Get Pro
            </a>
          </div>
        </div>
        <div className="plan-foot">Cancel anytime. No hidden costs.</div>
      </div>
    </section>
  )
}
