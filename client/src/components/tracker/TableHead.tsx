import { Star } from 'lucide-react'
import { TH, FIRST_COL_PL, LAST_COL_PR, COL_W } from './styles'

export function TableHead() {
  return (
    <tr className="border-b border-[rgba(255,255,255,0.07)]">
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
      <th className={`${TH} pl-9`} style={{ minWidth: COL_W.jobName }}>
        Job title
      </th>
      <th className={TH} style={{ minWidth: COL_W.status }}>
        Status
      </th>
      <th className={TH} style={{ minWidth: COL_W.location }}>
        Location
      </th>
      <th className={TH} style={{ minWidth: COL_W.salary }}>
        Salary
      </th>
      <th className={TH} style={{ minWidth: COL_W.workStyle }}>
        Work style
      </th>
      <th className={TH} style={{ minWidth: COL_W.visa }}>
        Visa
      </th>
      <th className={TH} style={{ minWidth: COL_W.applied }}>
        Applied
      </th>
      <th className={TH} style={{ minWidth: COL_W.timeInStage }}>
        Time in stage
      </th>
      <th
        className={`${TH} ${LAST_COL_PR}`}
        style={{ minWidth: COL_W.skills, width: '20%' }}
      >
        Skills
      </th>
    </tr>
  )
}
