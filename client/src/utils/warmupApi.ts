import { getApiUrl } from '@/api/api'

export function warmupApi(): void {
  fetch(getApiUrl('/api/health'), { method: 'GET', cache: 'no-store' }).catch(
    () => {},
  )
}
