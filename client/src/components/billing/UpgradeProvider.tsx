import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { isPlanLimitError, type PlanLimitResource } from '@/api/api'
import { UpgradeDialog } from './UpgradeDialog'
import { pdfExportUpgradeReason } from './pdfExportLimit'
import { RESOURCE_NOUNS } from './planData'

interface UpgradeContextValue {
  // Opens the upgrade dialog with an optional context-specific reason line.
  openUpgrade: (reason?: string) => void
  // Inspects an error; if it's a structured `plan_limit` response, opens the
  // dialog with a resource-specific reason and returns true (handled).
  handlePlanLimitError: (err: unknown) => boolean
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null)

function reasonForLimit(resource: PlanLimitResource, limit: number): string {
  if (resource === 'pdfExports') return pdfExportUpgradeReason(limit)
  const noun = RESOURCE_NOUNS[resource].plural
  return `You've reached your Free plan limit of ${limit} ${noun}. Upgrade to Pro to add more.`
}

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | undefined>(undefined)

  const openUpgrade = useCallback((nextReason?: string) => {
    setReason(nextReason)
    setOpen(true)
  }, [])

  const handlePlanLimitError = useCallback(
    (err: unknown) => {
      if (!isPlanLimitError(err) || !err.planLimit) return false
      const { resource, limit, plan } = err.planLimit
      // A Pro user hitting a hard ceiling (e.g. 500 applications) has nothing to
      // upgrade to — let the caller surface the server's message instead.
      if (plan === 'pro') return false
      openUpgrade(reasonForLimit(resource, limit))
      return true
    },
    [openUpgrade],
  )

  const value = useMemo(
    () => ({ openUpgrade, handlePlanLimitError }),
    [openUpgrade, handlePlanLimitError],
  )

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      <UpgradeDialog open={open} onOpenChange={setOpen} reason={reason} />
    </UpgradeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUpgrade(): UpgradeContextValue {
  const ctx = useContext(UpgradeContext)
  if (!ctx) throw new Error('useUpgrade must be used within UpgradeProvider')
  return ctx
}
