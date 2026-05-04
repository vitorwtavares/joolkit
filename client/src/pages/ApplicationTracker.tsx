import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Filter, Columns3, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useApplications,
  useCreateApplication,
} from '@/api/hooks/useApplications'
import type { ApplicationView } from '@/api/hooks/useApplications'
import { ApplicationTable } from '@/components/tracker/ApplicationTable'
import { ApplicationDrawer } from '@/components/tracker/ApplicationDrawer'
import { PageHeader } from '@/components/layout/PageHeader'

const VIEWS: { label: string; value: ApplicationView }[] = [
  { label: 'All', value: 'all' },
  { label: 'Prospects', value: 'prospects' },
  { label: 'Ready to apply', value: 'ready' },
  { label: 'Applied', value: 'applied' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'No openings', value: 'no-openings' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Favorites', value: 'favorites' },
]

export default function ApplicationTracker() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('view') ?? 'all'
  const view = (
    VIEWS.some((v) => v.value === raw) ? raw : 'all'
  ) as ApplicationView

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mountedAppId, setMountedAppId] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: applications = [], isLoading } = useApplications(view)
  const createApplication = useCreateApplication()

  const mountedApp = mountedAppId
    ? (applications.find((a) => a.id === mountedAppId) ?? null)
    : null

  function forceCloseDrawer() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(null)
    setDrawerOpen(false)
    setMountedAppId(null)
  }

  function openDrawer(id: string) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(id)
    setMountedAppId(id)
    requestAnimationFrame(() => setDrawerOpen(true))
  }

  function closeDrawer() {
    setSelectedAppId(null)
    setDrawerOpen(false)
    closeTimerRef.current = setTimeout(() => setMountedAppId(null), 150)
  }

  function setView(v: ApplicationView) {
    setSearchParams({ view: v }, { replace: true })
  }

  function handleNewEntry() {
    createApplication.mutate(
      { status: 'prospect' },
      { onError: () => toast.error('Failed to create entry') },
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column: header + tabs + table */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-16 pt-16 pb-0">
          <PageHeader
            title="Applications"
            subtitle="Track every application in one place."
            subtitleClassName="mb-4"
          />
        </div>

        {/* View tabs + actions row */}
        <div
          className="flex flex-shrink-0 items-center overflow-x-auto [scrollbar-width:none] max-[1350px]:flex-wrap [&::-webkit-scrollbar]:hidden"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
        >
          <div
            role="tablist"
            className="flex items-center gap-0.5 ps-16 pe-[6px]"
          >
            {VIEWS.map(({ label, value }) => (
              <button
                key={value}
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={cn(
                  'cursor-pointer border-b-2 px-3.5 py-2 text-[14px] font-medium whitespace-nowrap transition-colors',
                  'mb-[-0.5px]',
                  view === value
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 pe-7 pb-2 max-[1350px]:flex-none max-[1350px]:justify-start max-[1350px]:pt-2 max-[1350px]:pl-16">
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-[5px] rounded-md border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[14px] text-muted-foreground opacity-50"
            >
              <Filter size={16} />
              Filter
            </button>
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-[5px] rounded-md border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[14px] text-muted-foreground opacity-50"
            >
              <Columns3 size={16} />
              Columns
            </button>
            <button
              onClick={handleNewEntry}
              disabled={createApplication.isPending}
              className="flex min-w-[110px] cursor-pointer items-center justify-center gap-[5px] rounded-md border border-[rgba(255,255,255,0.15)] px-2.5 py-1 text-[14px] whitespace-nowrap text-foreground transition-colors hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              New entry
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <ApplicationTable
            applications={applications}
            isLoading={isLoading}
            selectedAppId={selectedAppId}
            onRowClick={openDrawer}
            onDeleteSelected={forceCloseDrawer}
          />
        </div>
      </div>

      {/* Right column: full-height drawer with slide animation */}
      <div
        className={cn(
          'relative z-[20] flex-shrink-0 overflow-hidden',
          mountedApp && 'border-l border-[rgba(255,255,255,0.07)]',
        )}
        style={{
          width: drawerOpen ? 700 : 0,
          transition: 'width 150ms ease-in-out',
          willChange: 'width',
        }}
      >
        {mountedApp && (
          <ApplicationDrawer app={mountedApp} onClose={closeDrawer} />
        )}
      </div>
    </div>
  )
}
