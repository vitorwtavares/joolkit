const PING_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
const STORAGE_KEY = btoa('server_last_ping')

export function pingServer(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  const last = raw ? Number(atob(raw)) : 0
  if (Date.now() - last < PING_INTERVAL_MS) return

  localStorage.setItem(STORAGE_KEY, btoa(String(Date.now())))
  fetch(`${import.meta.env.VITE_API_URL}/api/health`).catch(() => {})
}
