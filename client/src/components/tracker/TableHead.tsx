import { Star } from 'lucide-react'
import { TH, FIRST_COL_PL, LAST_COL_PR, COL_W } from './styles'

interface TableHeadProps {
  hiddenColumns?: string[] | null
}

export function TableHead({ hiddenColumns }: TableHeadProps) {
  const show = (key: string) => !hiddenColumns?.includes(key)

  return (
    <tr className="border-b border-border-subtle">
      <th
        className={`${TH} ${FIRST_COL_PL}`}
        style={{ minWidth: COL_W.star }}
        aria-label="Favorite"
      >
        <Star size={15} aria-hidden="true" className="ml-0.5" />
      </th>
      <th className={`${TH} pl-9`} style={{ minWidth: COL_W.company }}>
        Company
      </th>
      {show('jobName') && (
        <th className={`${TH} pl-9`} style={{ minWidth: COL_W.jobName }}>
          Job title
        </th>
      )}
      {show('status') && (
        <th className={TH} style={{ minWidth: COL_W.status }}>
          Status
        </th>
      )}
      {show('location') && (
        <th className={TH} style={{ minWidth: COL_W.location }}>
          Location
        </th>
      )}
      {show('salary') && (
        <th className={TH} style={{ minWidth: COL_W.salary }}>
          Salary
        </th>
      )}
      {show('workStyle') && (
        <th className={TH} style={{ minWidth: COL_W.workStyle }}>
          Work style
        </th>
      )}
      {show('visa') && (
        <th className={TH} style={{ minWidth: COL_W.visa }}>
          Visa
        </th>
      )}
      {show('applied') && (
        <th className={TH} style={{ minWidth: COL_W.applied }}>
          Applied
        </th>
      )}
      {show('nextDeadline') && (
        <th className={TH} style={{ minWidth: COL_W.nextDeadline }}>
          Next deadline
        </th>
      )}
      {show('timeInStage') && (
        <th className={TH} style={{ minWidth: COL_W.timeInStage }}>
          Time in stage
        </th>
      )}
      {show('skills') && (
        <th
          className={`${TH} ${LAST_COL_PR}`}
          style={{ minWidth: COL_W.skills, width: '20%' }}
        >
          Skills
        </th>
      )}
    </tr>
  )
}
