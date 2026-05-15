import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { AuthProvider } from './context/auth'
import './index.css'
import App from './App'

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000
const CACHE_BUSTER = 'noloop-v1'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'noloop:query-cache',
})

// Pre-hydrate before React mounts so cached data is available on first render.
await persistQueryClientRestore({
  queryClient,
  persister,
  maxAge: CACHE_MAX_AGE,
  buster: CACHE_BUSTER,
})

persistQueryClientSubscribe({
  queryClient,
  persister,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.queryKey[0] === 'profile',
  },
})

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
