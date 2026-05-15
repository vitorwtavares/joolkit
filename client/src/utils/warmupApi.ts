const BASE_URL = import.meta.env.VITE_API_URL

export function warmupApi(): void {
  if (!BASE_URL) return
  fetch(`${BASE_URL}/api/health`, { method: 'GET', cache: 'no-store' }).catch(
    () => {},
  )
}
