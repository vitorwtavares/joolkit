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

  const { data: applications = [], isLoading } = useApplications(view)
  const createApplication = useCreateApplication()

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
    <div className="flex flex-1 flex-col overflow-hidden">
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
        className="flex flex-shrink-0 items-center"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
      >
        <div role="tablist" className="flex items-center gap-0.5 px-16">
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

        <div className="flex flex-1 items-center justify-end gap-2 px-7 pb-2">
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
            className="flex cursor-pointer items-center gap-[5px] rounded-md border border-[rgba(255,255,255,0.15)] px-2.5 py-1 text-[14px] text-foreground transition-colors hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            New entry
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <ApplicationTable applications={applications} isLoading={isLoading} />
      </div>
    </div>
  )
}
