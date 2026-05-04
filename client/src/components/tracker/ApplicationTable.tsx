import { TableHead } from './TableHead'
import { COL_W } from './styles'
import { TableSkeleton } from './TableSkeleton'
import { ApplicationRow } from './ApplicationRow'
import type { Application } from '@/api/hooks/useApplications'

interface ApplicationTableProps {
  applications: Application[]
  isLoading: boolean
  selectedAppId: string | null
  onRowClick: (id: string) => void
}

export function ApplicationTable({
  applications,
  isLoading,
  selectedAppId,
  onRowClick,
}: ApplicationTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <TableHead />
      </thead>
      <tbody>
        {isLoading && <TableSkeleton />}
        {!isLoading && applications.length === 0 && (
          <tr>
            <td
              colSpan={Object.keys(COL_W).length}
              className="py-16 text-center text-[16px] text-muted-foreground"
            >
              No applications yet.
            </td>
          </tr>
        )}
        {!isLoading &&
          applications.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              isSelected={app.id === selectedAppId}
              onRowClick={() => onRowClick(app.id)}
            />
          ))}
      </tbody>
    </table>
  )
}
