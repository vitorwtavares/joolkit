import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/auth'
import './index.css'
import App from './App'

const LEGACY_QUERY_CACHE_KEY = 'joolkit:query-cache'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

try {
  // TODO 2026-06-11: Remove this legacy cache cleanup after browsers have cleared it.
  window.localStorage.removeItem(LEGACY_QUERY_CACHE_KEY)
} catch {
  // Storage can be unavailable in restricted browser contexts.
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found in index.html')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
