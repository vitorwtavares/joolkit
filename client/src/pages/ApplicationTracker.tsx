import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/api/api'
import { cn } from '@/lib/utils'
import {
  appMatchesFilter,
  useApplications,
  useCreateApplication,
} from '@/api/hooks/useApplications'
import type {
  ApplicationStatus,
  CreateApplicationPayload,
} from '@/api/hooks/useApplications'
import {
  useCreateTrackerView,
  useDeleteTrackerView,
  useTrackerViews,
  useUpdateTrackerView,
  type FilterConfig,
  type SortConfig,
  type TrackerView,
} from '@/api/hooks/useTrackerViews'
import { ApplicationTable } from '@/components/tracker/ApplicationTable'
import { ApplicationDrawer } from '@/components/tracker/ApplicationDrawer'
import { SortControl } from '@/components/tracker/SortControl'
import { FilterControl } from '@/components/tracker/FilterControl'
import { ColumnsControl } from '@/components/tracker/ColumnsControl'
import { sortApplications } from '@/components/tracker/applicationSort'
import { ViewTab } from '@/components/tracker/ViewTab'
import { ViewFormDialog } from '@/components/tracker/ViewFormDialog'
import { DeleteViewDialog } from '@/components/tracker/DeleteViewDialog'
import { TrackerDraftProvider } from '@/components/tracker/draft'
import { STATUS_CONFIG } from '@/components/tracker/statusConfig'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

// Status keys in pipeline order — the order we list and prefer statuses in.
const STATUS_OPTIONS = Object.keys(STATUS_CONFIG) as ApplicationStatus[]

// Derives the starting field values for a new entry so it lands in the
// currently active view rather than being filtered out on creation. For a
// status filter we pick the first status the filter actually shows (works for
// both Includes and Excludes); the Favorites view flags the row favorite; "All"
// (no filter) defaults to prospect.
function newEntryDefaults(
  view: TrackerView | undefined,
): CreateApplicationPayload {
  const filter = view?.filter_config
  if (!filter) return { status: 'prospect' }
  if (filter.field === 'is_favorite') {
    return { status: 'prospect', is_favorite: true }
  }
  const shows = (status: string) =>
    filter.operator === 'is_not'
      ? !filter.values.includes(status)
      : filter.values.includes(status)
  return { status: STATUS_OPTIONS.find(shows) ?? 'prospect' }
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
  const { data: views = [], isLoading: viewsLoading } = useTrackerViews()

  // The permanent "All" view (filter_config null) is the fallback tab when no
  // view is selected.
  const allView = useMemo(
    () => views.find((v) => v.is_permanent) ?? views[0],
    [views],
  )
  const requestedViewId = searchParams.get('view')
  const activeView = views.find((v) => v.id === requestedViewId) ?? allView

  const [search, setSearch] = useState('')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mountedAppId, setMountedAppId] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [tabsOverflowLeft, setTabsOverflowLeft] = useState(false)
  const [tabsOverflowRight, setTabsOverflowRight] = useState(false)

  // One shared fetch of the full dataset feeds every view. Filter, sort, and
  // search are all applied client-side below — consistent and instant, and it
  // keeps optimistically created/edited rows correctly placed without a refetch.
  const { data: applications = [], isLoading: appsLoading } = useApplications()
  const isLoading = viewsLoading || appsLoading

  const trimmedSearch = search.trim()
  const filterConfig = activeView?.filter_config ?? null
  const sortConfig = activeView?.sort_config ?? null
  const visibleApplications = useMemo(() => {
    const filtered = applications.filter((app) =>
      appMatchesFilter(app, filterConfig),
    )
    const q = trimmedSearch.toLowerCase()
    const searched = q
      ? filtered.filter((app) => app.company_name.toLowerCase().includes(q))
      : filtered
    return sortApplications(searched, sortConfig)
  }, [applications, filterConfig, trimmedSearch, sortConfig])

  const emptyMessage = trimmedSearch
    ? 'No companies match your search.'
    : filterConfig && applications.length > 0
      ? 'No applications match this view.'
      : undefined

  const viewCounts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const v of views) {
      out[v.id] = applications.filter((app) =>
        appMatchesFilter(app, v.filter_config),
      ).length
    }
    return out
  }, [views, applications])

  const createApplication = useCreateApplication()
  const createView = useCreateTrackerView()
  const updateView = useUpdateTrackerView()
  const deleteView = useDeleteTrackerView()

  // View management dialogs. `viewForm` drives the create/rename dialog;
  // `deleteTarget` drives the delete confirmation.
  const [viewForm, setViewForm] = useState<
    | { mode: 'create'; filterConfig?: FilterConfig }
    | { mode: 'rename'; view: TrackerView }
    | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackerView | null>(null)

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

  function setView(id: string) {
    setSearchParams({ view: id }, { replace: true })
  }

  function handleNewEntry() {
    createApplication.mutate(newEntryDefaults(activeView), {
      onSuccess: (app) => openDrawer(app.id),
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to create entry',
        ),
    })
  }

  function handleSortChange(next: SortConfig | null) {
    if (!activeView) return
    updateView.mutate(
      { id: activeView.id, sort_config: next },
      { onError: () => toast.error('Failed to update sort') },
    )
  }

  function handleApplyFilter(next: FilterConfig | null) {
    if (!activeView) return
    // The permanent "All" view can't hold a filter — prompt the user to save
    // the filter as a new view instead. Clearing (null) on "All" is a no-op.
    if (activeView.is_permanent) {
      if (next) setViewForm({ mode: 'create', filterConfig: next })
      return
    }
    updateView.mutate(
      { id: activeView.id, filter_config: next },
      { onError: () => toast.error('Failed to update filter') },
    )
  }

  function handleColumnsChange(next: string[] | null) {
    if (!activeView) return
    updateView.mutate(
      { id: activeView.id, hidden_columns: next },
      { onError: () => toast.error('Failed to update columns') },
    )
  }

  function handleSubmitView(name: string) {
    if (!viewForm) return
    if (viewForm.mode === 'create') {
      createView.mutate(
        { name, filter_config: viewForm.filterConfig ?? null },
        {
          onSuccess: (view) => {
            setViewForm(null)
            setView(view.id)
          },
          onError: () => toast.error('Failed to create view'),
        },
      )
    } else {
      updateView.mutate(
        { id: viewForm.view.id, name },
        {
          onSuccess: () => setViewForm(null),
          onError: () => toast.error('Failed to rename view'),
        },
      )
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleteView.mutate(target.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        // Fall back to the permanent "All" view if the active view was deleted.
        if (activeView?.id === target.id && allView) setView(allView.id)
      },
      onError: () => toast.error('Failed to delete view'),
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
              {views.map((v) => (
                <ViewTab
                  key={v.id}
                  view={v}
                  isActive={activeView?.id === v.id}
                  count={viewCounts[v.id] ?? 0}
                  onSelect={() => setView(v.id)}
                  onRename={() => setViewForm({ mode: 'rename', view: v })}
                  onDelete={() => setDeleteTarget(v)}
                />
              ))}
              <button
                type="button"
                onClick={() => setViewForm({ mode: 'create' })}
                aria-label="New view"
                className="ms-0.5 mb-[-0.5px] flex size-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus size={16} />
              </button>
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
            <div className="relative max-[800px]:flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company"
                aria-label="Search by company name"
                className="h-8 w-[180px] ps-8 pe-7 max-[800px]:w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute end-1.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <SortControl value={sortConfig} onChange={handleSortChange} />
            <FilterControl
              value={activeView?.filter_config ?? null}
              onApply={handleApplyFilter}
            />
            <ColumnsControl
              value={activeView?.hidden_columns ?? null}
              onChange={handleColumnsChange}
            />
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
            applications={visibleApplications}
            isLoading={isLoading}
            selectedAppId={selectedAppId}
            hiddenColumns={activeView?.hidden_columns ?? null}
            onRowClick={openDrawer}
            onCloseDrawer={closeDrawer}
            onDeleteSelected={forceCloseDrawer}
            emptyMessage={emptyMessage}
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

      <ViewFormDialog
        open={viewForm !== null}
        onOpenChange={(open) => {
          if (!open) setViewForm(null)
        }}
        mode={viewForm?.mode ?? 'create'}
        initialName={viewForm?.mode === 'rename' ? viewForm.view.name : ''}
        description={
          viewForm?.mode === 'create' && viewForm.filterConfig
            ? 'The "All" view can\'t be filtered. Save this filter as a new view instead.'
            : undefined
        }
        isSubmitting={
          viewForm?.mode === 'rename'
            ? updateView.isPending
            : createView.isPending
        }
        onSubmit={handleSubmitView}
      />

      <DeleteViewDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        viewName={deleteTarget?.name ?? null}
        isDeleting={deleteView.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
