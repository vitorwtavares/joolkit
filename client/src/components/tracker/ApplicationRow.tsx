import { Star } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatTimeInStage } from '@/utils/formatTimeInStage'
import { TD, FIRST_COL_PL, LAST_COL_PR } from './styles'
import type { Application } from '@/api/hooks/useApplications'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  // Parse date parts directly to avoid UTC→local timezone shift on date-only strings
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

interface ApplicationRowProps {
  app: Application
}

export function ApplicationRow({ app }: ApplicationRowProps) {
  const visaColor =
    app.visa_support === 'yes'
      ? '#7dd4a0'
      : app.visa_support === 'no'
        ? '#f09595'
        : undefined

  return (
    <tr className="cursor-pointer hover:bg-[rgba(255,255,255,0.02)]">
      <td className={`${TD} ${FIRST_COL_PL}`}>
        <Star
          size={14}
          className={
            app.is_favorite
              ? 'fill-[#EF9F27] text-[#EF9F27]'
              : 'text-muted-foreground/30'
          }
        />
      </td>

      <td className={`${TD} pl-2`}>
        {app.careers_url ? (
          <a
            href={app.careers_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-foreground hover:underline"
          >
            {app.company_name || (
              <span className="text-muted-foreground italic">Unnamed</span>
            )}
          </a>
        ) : (
          <span className="font-medium text-foreground">
            {app.company_name || (
              <span className="text-muted-foreground italic">Unnamed</span>
            )}
          </span>
        )}
      </td>

      <td className={TD}>
        <StatusBadge status={app.status} />
      </td>

      <td className={`${TD} text-muted-foreground`}>
        {app.location?.name ?? '—'}
      </td>

      <td className={`${TD} text-muted-foreground`}>{app.salary || '—'}</td>

      <td className={`${TD} text-muted-foreground capitalize`}>
        {app.work_style ?? '—'}
      </td>

      <td className={TD}>
        <span
          style={{ color: visaColor }}
          className={!visaColor ? 'text-muted-foreground' : ''}
        >
          {app.visa_support === 'yes'
            ? 'Yes'
            : app.visa_support === 'no'
              ? 'No'
              : '—'}
        </span>
      </td>

      <td className={`${TD} text-muted-foreground`}>
        {formatDate(app.date_applied)}
      </td>

      <td className={`${TD} text-muted-foreground`}>
        {formatTimeInStage(app.last_moved_at)}
      </td>

      <td className={`${TD} ${LAST_COL_PR}`}>
        <div className="flex flex-wrap gap-[3px]">
          {(app.skills ?? []).map(({ skill }) => (
            <span
              key={skill.id}
              className="inline-flex items-center rounded-[4px] border border-[rgba(255,255,255,0.07)] bg-secondary px-[6px] py-px text-[14px] text-muted-foreground"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}
