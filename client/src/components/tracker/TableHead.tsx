import { Star } from 'lucide-react'
import { TH, FIRST_COL_PL, LAST_COL_PR, COL_W } from './styles'

export function TableHead() {
  return (
    <tr className="border-b border-[rgba(255,255,255,0.07)]">
      <th
        className={`${TH} ${FIRST_COL_PL}`}
        style={{ width: COL_W.star }}
        aria-label="Favorite"
      >
        <Star size={13} aria-hidden="true" className="ml-0.5" />
      </th>
      <th className={`${TH} pl-2`} style={{ width: COL_W.company }}>
        Company
      </th>
      <th className={TH} style={{ width: COL_W.status }}>
        Status
      </th>
      <th className={TH} style={{ width: COL_W.location }}>
        Location
      </th>
      <th className={TH} style={{ width: COL_W.salary }}>
        Salary
      </th>
      <th className={TH} style={{ width: COL_W.workStyle }}>
        Work style
      </th>
      <th className={TH} style={{ width: COL_W.visa }}>
        Visa
      </th>
      <th className={TH} style={{ width: COL_W.applied }}>
        Applied
      </th>
      <th className={TH} style={{ width: COL_W.timeInStage }}>
        Time in stage
      </th>
      <th className={`${TH} ${LAST_COL_PR}`} style={{ width: COL_W.skills }}>
        Skills
      </th>
    </tr>
  )
}
