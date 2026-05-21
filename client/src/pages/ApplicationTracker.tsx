import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Filter, Columns3, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  appMatchesView,
  useApplications,
  useCreateApplication,
} from '@/api/hooks/useApplications'
import type {
  ApplicationView,
  CreateApplicationPayload,
} from '@/api/hooks/useApplications'
import { ApplicationTable } from '@/components/tracker/ApplicationTable'
import { ApplicationDrawer } from '@/components/tracker/ApplicationDrawer'
import { TrackerDraftProvider } from '@/components/tracker/draft'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

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

// Fade for the tabs scroll area. The right edge fades over a 48px region
// (visible at 80px from the edge → transparent at 32px from the edge), with
// the chevron sitting in the fully-masked 32px strip. The left edge mirrors
// this but starts after the `ps-16` (64px) leading spacing so the left
// chevron lines up with where the first tab would normally begin —
// transparent through 96px (covering the spacing + chevron strip), then
// fading to fully visible at 144px.
function getTabsMaskImage(
  overflowLeft: boolean,
  overflowRight: boolean,
): string | undefined {
  if (!overflowLeft && !overflowRight) return undefined
  const stops: string[] = []
  if (overflowLeft) stops.push('transparent 96px', 'black 144px')
  if (overflowRight)
    stops.push('black calc(100% - 80px)', 'transparent calc(100% - 32px)')
  return `linear-gradient(to right, ${stops.join(', ')})`
}

function newEntryDefaults(view: ApplicationView): CreateApplicationPayload {
  switch (view) {
    case 'ready':
      return { status: 'ready_to_apply' }
    case 'applied':
      return { status: 'applied' }
    case 'in-progress':
      return { status: 'pending_schedule' }
    case 'no-openings':
      return { status: 'no_openings' }
    case 'rejected':
      return { status: 'rejected' }
    case 'favorites':
      return { status: 'prospect', is_favorite: true }
    default:
      return { status: 'prospect' }
  }
}

export default function ApplicationTracker() {
  return (
    <TrackerDraftProvider>
      <ApplicationTrackerInner />
    </TrackerDraftProvider>
  )
}

function ApplicationTrackerInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('view') ?? 'all'
  const view = (
    VIEWS.some((v) => v.value === raw) ? raw : 'all'
  ) as ApplicationView

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mountedAppId, setMountedAppId] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [tabsOverflowLeft, setTabsOverflowLeft] = useState(false)
  const [tabsOverflowRight, setTabsOverflowRight] = useState(false)

  // Server applies the view filter (and, in P7+, stored filter configs from
  // `tracker_views`) — keep this query as the source of truth for what gets
  // rendered. Don't refactor this into a client-side filter on the `'all'`
  // dataset: that would diverge from server-applied filters, defeat per-view
  // filter persistence, and break the day we paginate.
  const { data: applications = [], isLoading } = useApplications(view)

  // Tab counts are derived separately. For now we piggy-back on a full `'all'`
  // fetch (cached, shared with the display query when view === 'all').
  // TODO: replace with a dedicated `GET /api/applications/counts` endpoint
  // when we paginate — otherwise this fetch grows unbounded with the dataset.
  const { data: allApplications = [] } = useApplications('all')

  const viewCounts = useMemo(() => {
    const out = {} as Record<ApplicationView, number>
    for (const v of VIEWS) {
      out[v.value] = allApplications.filter((app) =>
        appMatchesView(app, v.value),
      ).length
    }
    return out
  }, [allApplications])

  const createApplication = useCreateApplication()

  useEffect(() => {
    const el = tabsScrollRef.current
    if (!el) return
    const check = () => {
      setTabsOverflowLeft(el.scrollLeft > 1)
      setTabsOverflowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    const horizontalWheelDelta = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE)
        return event.deltaY * 16
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE)
        return event.deltaY * el.clientWidth
      return event.deltaY
    }
    const scrollVerticalWheelHorizontally = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      event.stopPropagation()
      el.scrollLeft -= horizontalWheelDelta(event)
      check()
    }

    const resize = new ResizeObserver(check)
    resize.observe(el)
    for (const child of Array.from(el.children)) resize.observe(child)

    // Track when tabs are added/removed (dynamic views in P7) and start
    // observing their size too. ResizeObserver fires on existing children's
    // size changes; MutationObserver picks up new children's existence.
    const mutation = new MutationObserver((entries) => {
      for (const e of entries) {
        for (const node of e.addedNodes) {
          if (node instanceof Element) resize.observe(node)
        }
      }
      check()
    })
    mutation.observe(el, { childList: true })

    el.addEventListener('scroll', check)
    el.addEventListener('wheel', scrollVerticalWheelHorizontally, {
      passive: false,
    })
    return () => {
      el.removeEventListener('scroll', check)
      el.removeEventListener('wheel', scrollVerticalWheelHorizontally)
      resize.disconnect()
      mutation.disconnect()
    }
  }, [])
  const [mountedApp, setMountedApp] = useState<(typeof applications)[0] | null>(
    null,
  )

  // Keep mountedApp in sync with live list changes, but never set it to null
  // from here — that preserves the drawer content during an optimistic delete
  // until forceCloseDrawer explicitly clears it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!mountedAppId) {
      setMountedApp(null)
      return
    }
    const app = applications.find((a) => a.id === mountedAppId) ?? null
    if (app) setMountedApp(app)
  }, [applications, mountedAppId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const forceCloseDrawer = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(null)
    setDrawerOpen(false)
    setMountedAppId(null)
  }, [])

  const openDrawer = useCallback((id: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setSelectedAppId(id)
    setMountedAppId(id)
    requestAnimationFrame(() => setDrawerOpen(true))
  }, [])

  const closeDrawer = useCallback(() => {
    setSelectedAppId(null)
    setDrawerOpen(false)
    closeTimerRef.current = setTimeout(() => setMountedAppId(null), 150)
  }, [])

  function setView(v: ApplicationView) {
    setSearchParams({ view: v }, { replace: true })
  }

  function handleNewEntry() {
    createApplication.mutate(newEntryDefaults(view), {
      onSuccess: (app) => openDrawer(app.id),
      onError: () => toast.error('Failed to create entry'),
    })
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
        <div className="flex flex-shrink-0 items-center border-b border-border-subtle max-[800px]:flex-col max-[800px]:items-stretch">
          <div className="relative min-w-0 flex-1">
            <div
              ref={tabsScrollRef}
              role="tablist"
              className="flex touch-pan-x items-center gap-0.5 overflow-x-auto overflow-y-hidden overscroll-x-auto overscroll-y-none ps-16 pe-[6px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                maskImage: getTabsMaskImage(
                  tabsOverflowLeft,
                  tabsOverflowRight,
                ),
              }}
            >
              {VIEWS.map(({ label, value }) => {
                const isActive = view === value
                const count = viewCounts[value]
                return (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setView(value)}
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 border-b-2 px-3.5 py-2 text-[14px] font-medium whitespace-nowrap transition-colors',
                      'mb-[-0.5px]',
                      isActive
                        ? 'border-brand text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px font-mono text-[11px]',
                        isActive
                          ? 'bg-brand-soft text-brand'
                          : 'bg-secondary text-text-faint',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Chevrons — appear only when there are more tabs to scroll to in
                that direction. Sit outside the masked scroll area so the mask
                doesn't fade them, and absorb pointer events so users can't
                accidentally click a tab hidden under the fade. */}
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 left-16 flex w-8 items-center justify-start transition-opacity',
                tabsOverflowLeft
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronLeft size={16} className="text-foreground" />
            </div>
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 right-0 flex w-8 items-center justify-end pr-2 transition-opacity',
                tabsOverflowRight
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronRight size={16} className="text-foreground" />
            </div>
          </div>

          <div
            className={cn(
              'flex flex-shrink-0 items-center justify-end gap-2 ps-4 pe-7 pb-1 max-[800px]:justify-start max-[800px]:py-2 max-[800px]:pl-16',
              tabsOverflowRight &&
                'border-l border-border-subtle max-[800px]:border-l-0',
            )}
          >
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="Filter"
              className="max-[1599px]:size-8 max-[1599px]:px-0"
            >
              <Filter size={14} />
              <span className="hidden min-[1600px]:inline">Filter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label="Columns"
              className="max-[1599px]:size-8 max-[1599px]:px-0"
            >
              <Columns3 size={14} />
              <span className="hidden min-[1600px]:inline">Columns</span>
            </Button>
            <Button
              size="sm"
              onClick={handleNewEntry}
              disabled={createApplication.isPending}
              className="min-w-[110px]"
            >
              <Plus size={14} />
              New entry
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <ApplicationTable
            applications={applications}
            isLoading={isLoading}
            selectedAppId={selectedAppId}
            onRowClick={openDrawer}
            onCloseDrawer={closeDrawer}
            onDeleteSelected={forceCloseDrawer}
          />
        </div>
      </div>

      {/* Right column: full-height drawer with slide animation */}
      <div
        className={cn(
          'relative z-[20] flex-shrink-0 overflow-hidden',
          mountedApp && 'border-l border-border',
        )}
        style={{
          width: drawerOpen ? 650 : 0,
          transition: 'width 150ms ease-in-out',
          willChange: 'width',
        }}
      >
        {mountedApp && (
          <ApplicationDrawer
            app={mountedApp}
            onClose={closeDrawer}
            onDelete={forceCloseDrawer}
          />
        )}
      </div>
    </div>
  )
}
