import { useEffect, useState } from 'react'

export type DisplayCurrency = 'usd' | 'brl'

// Best-effort pre-signup currency for the pricing section, from the public
// `/api/geo` endpoint (Vercel IP geolocation). Defaults to USD and never blocks
// render. Same-origin relative fetch keeps the landing portable to its own
// deployment, which just needs to expose an equivalent `/api/geo`.
export function useDisplayCurrency(): DisplayCurrency {
  const [currency, setCurrency] = useState<DisplayCurrency>('usd')

  useEffect(() => {
    let active = true
    fetch('/api/geo', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && (data?.currency === 'brl' || data?.currency === 'usd')) {
          setCurrency(data.currency)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return currency
}
