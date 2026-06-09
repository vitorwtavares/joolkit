import { useState } from 'react'
import { toast } from 'sonner'
import type { SetURLSearchParams } from 'react-router'
import {
  useCreateTrackerView,
  useDeleteTrackerView,
  useUpdateTrackerView,
  type FilterConfig,
  type SortConfig,
  type TrackerView,
} from '@/api/hooks/useTrackerViews'

interface UseViewManagementParams {
  activeView: TrackerView | undefined
  allView: TrackerView | undefined
  setSearchParams: SetURLSearchParams
  onViewCreated?: () => void
  onViewDeleted?: () => void
}

export function useViewManagement({
  activeView,
  allView,
  setSearchParams,
  onViewCreated,
  onViewDeleted,
}: UseViewManagementParams) {
  const createView = useCreateTrackerView()
  const updateView = useUpdateTrackerView()
  const deleteView = useDeleteTrackerView()

  const [viewForm, setViewForm] = useState<
    | { mode: 'create'; filterConfig?: FilterConfig }
    | { mode: 'rename'; view: TrackerView }
    | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<TrackerView | null>(null)

  function setView(id: string) {
    setSearchParams({ view: id }, { replace: true })
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
      {
        id: activeView.id,
        hidden_columns: activeView.is_permanent && next === null ? [] : next,
      },
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
            onViewCreated?.()
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
        if (activeView?.id === target.id && allView) {
          setView(allView.id)
          onViewDeleted?.()
        }
      },
      onError: () => toast.error('Failed to delete view'),
    })
  }

  return {
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
    isSubmittingView:
      viewForm?.mode === 'rename' ? updateView.isPending : createView.isPending,
    isDeletingView: deleteView.isPending,
  }
}
