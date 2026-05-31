import { TableHead } from './TableHead'
import { TableSkeleton, SkeletonRow } from './TableSkeleton'
import { ApplicationRow } from './ApplicationRow'
import { TOGGLEABLE_COLUMNS, isColumnVisible } from './columns'
import type { Application } from '@/api/hooks/useApplications'

interface ApplicationTableProps {
  applications: Application[]
  isLoading: boolean
  selectedAppId: string | null
  hiddenColumns?: string[] | null
  onRowClick: (id: string) => void
  onCloseDrawer: () => void
  onDeleteSelected?: () => void
  emptyMessage?: string
}

export function ApplicationTable({
  applications,
  isLoading,
  selectedAppId,
  hiddenColumns,
  onRowClick,
  onCloseDrawer,
  onDeleteSelected,
  emptyMessage = 'No applications yet.',
}: ApplicationTableProps) {
  // Star + company are always shown; the rest depend on the view's config.
  const visibleColumnCount =
    2 +
    TOGGLEABLE_COLUMNS.filter((c) => isColumnVisible(c.key, hiddenColumns))
      .length

  return (
    <table className="w-full border-collapse">
      <thead>
        <TableHead hiddenColumns={hiddenColumns} />
      </thead>
      <tbody>
        {isLoading && <TableSkeleton hiddenColumns={hiddenColumns} />}
        {!isLoading && applications.length === 0 && (
          <tr>
            <td
              colSpan={visibleColumnCount}
              className="py-16 text-center text-[16px] text-muted-foreground"
            >
              {emptyMessage}
            </td>
          </tr>
        )}
        {!isLoading &&
          applications.map((app) =>
            app.id.startsWith('temp-') ? (
              <SkeletonRow key={app.id} hiddenColumns={hiddenColumns} />
            ) : (
              <ApplicationRow
                key={app.id}
                app={app}
                isSelected={app.id === selectedAppId}
                hiddenColumns={hiddenColumns}
                onRowClick={onRowClick}
                onCloseDrawer={onCloseDrawer}
                onDeleteSelected={onDeleteSelected}
              />
            ),
          )}
      </tbody>
    </table>
  )
}
