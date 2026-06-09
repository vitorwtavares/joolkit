import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  PanelsTopLeft,
  Search,
  X,
} from 'lucide-react'
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
import { useTrackerViews, type TrackerView } from '@/api/hooks/useTrackerViews'
import { ApplicationTable } from '@/components/tracker/table/ApplicationTable'
import { ApplicationDrawer } from '@/components/tracker/ApplicationDrawer'
import { SortControl } from '@/components/tracker/controls/SortControl'
import { FilterControl } from '@/components/tracker/controls/FilterControl'
import { ColumnsControl } from '@/components/tracker/controls/ColumnsControl'
import { DEFAULT_ALL_VIEW_HIDDEN_COLUMNS } from '@/components/tracker/table/columns'
import { sortApplications } from '@/components/tracker/table/applicationSort'
import { ViewTab } from '@/components/tracker/views/ViewTab'
import { ViewFormDialog } from '@/components/tracker/views/ViewFormDialog'
import { DeleteViewDialog } from '@/components/tracker/views/DeleteViewDialog'
import { TrackerDraftProvider } from '@/components/tracker/draft'
import { STATUS_CONFIG } from '@/components/tracker/status/statusConfig'
import { useTabsScroll } from '@/components/tracker/useTabsScroll'
import { useDrawerState } from '@/components/tracker/useDrawerState'
import { useViewManagement } from '@/components/tracker/useViewManagement'
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
  const hiddenColumns =
    activeView?.hidden_columns ??
    (activeView?.is_permanent ? DEFAULT_ALL_VIEW_HIDDEN_COLUMNS : null)

  const [search, setSearch] = useState('')

  const {
    tabsScrollRef,
    tabsOverflowLeft,
    tabsOverflowRight,
    scrollTabsToStart,
    scrollTabsToEnd,
  } = useTabsScroll()

  const tableScrollRef = useRef<HTMLDivElement>(null)
  const savedScrollTopRef = useRef<number>(0)
  const prevVisibleIdsRef = useRef<string[]>([])

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

  // Track scroll position so it can be restored after a sort reorder.
  useEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    const onScroll = () => {
      savedScrollTopRef.current = el.scrollTop
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Restore scroll after a reorder (same set of IDs, different order). This
  // prevents the list jumping to the top when a sort-by-date optimistic update
  // reorders rows while the user is editing further down.
  useLayoutEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    const newIds = visibleApplications.map((a) => a.id)
    const prevIds = prevVisibleIdsRef.current
    const prevSet = new Set(prevIds)
    const isReorder =
      newIds.length === prevIds.length && newIds.every((id) => prevSet.has(id))
    if (isReorder) el.scrollTop = savedScrollTopRef.current
    prevVisibleIdsRef.current = newIds
  }, [visibleApplications])

  const {
    selectedAppId,
    drawerOpen,
    mountedApp,
    forceCloseDrawer,
    openDrawer,
    closeDrawer,
  } = useDrawerState(applications)

  const {
    viewForm,
    setViewForm,
    deleteTarget,
    setDeleteTarget,
    setView,
    handleSortChange,
    handleApplyFilter,
    handleColumnsChange,
    handleSubmitView,
    handleConfirmDelete,
    isSubmittingView,
    isDeletingView,
  } = useViewManagement({
    activeView,
    allView,
    setSearchParams,
    onViewCreated: () => requestAnimationFrame(() => scrollTabsToEnd()),
    onViewDeleted: () => scrollTabsToStart(),
  })

  function handleNewEntry() {
    createApplication.mutate(newEntryDefaults(activeView), {
      onSuccess: (app) => openDrawer(app.id),
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to create entry',
        ),
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
              className="flex touch-pan-x [scrollbar-width:none] items-center gap-0.5 overflow-x-auto overflow-y-hidden overscroll-x-auto overscroll-y-none ps-16 pe-[6px] [&::-webkit-scrollbar]:hidden"
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
                className="ms-0.5 mb-[-0.5px] flex size-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-md bg-secondary text-brand transition-colors hover:bg-brand-soft hover:text-brand"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Chevrons — appear only when there are more tabs to scroll to in
                that direction. Sit outside the masked scroll area so the mask
                doesn't fade them. */}
            <button
              type="button"
              aria-label="Scroll views to start"
              onClick={scrollTabsToStart}
              className={cn(
                'absolute inset-y-0 left-16 flex w-8 cursor-pointer items-center justify-start transition-opacity',
                tabsOverflowLeft
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>
            <button
              type="button"
              aria-label="Scroll views to end"
              onClick={scrollTabsToEnd}
              className={cn(
                'absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-end pr-2 transition-opacity',
                tabsOverflowRight
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewForm({ mode: 'create' })}
              aria-label="New view"
              className="max-[1599px]:size-8 max-[1599px]:px-0"
            >
              <PanelsTopLeft size={14} />
              <span className="hidden min-[1600px]:inline">New view</span>
            </Button>
            <ColumnsControl
              value={hiddenColumns}
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
        <div ref={tableScrollRef} className="flex-1 overflow-auto">
          <ApplicationTable
            applications={visibleApplications}
            isLoading={isLoading}
            selectedAppId={selectedAppId}
            hiddenColumns={hiddenColumns}
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
        isSubmitting={isSubmittingView}
        onSubmit={handleSubmitView}
      />

      <DeleteViewDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        viewName={deleteTarget?.name ?? null}
        isDeleting={isDeletingView}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
