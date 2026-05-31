import { Skeleton } from '@/components/ui/skeleton'
import { TD, FIRST_COL_PL, LAST_COL_PR } from './styles'

interface SkeletonRowProps {
  hiddenColumns?: string[] | null
}

export function SkeletonRow({ hiddenColumns }: SkeletonRowProps) {
  const show = (key: string) => !hiddenColumns?.includes(key)
  // The last visible column gets the trailing right padding so the row keeps
  // its breathing room regardless of which columns are hidden.
  const lastVisible = ['skills', 'timeInStage', 'nextDeadline', 'applied'].find(
    (key) => show(key),
  )

  return (
    <tr>
      <td className={`${TD} py-[14.5px] ${FIRST_COL_PL}`}>
        <Skeleton className="ml-0.5 h-[14px] w-[14px] rounded-sm" />
      </td>
      <td className={`${TD} py-[14.5px] pl-2`}>
        <Skeleton className="h-[14px] w-[120px] rounded-sm" />
      </td>
      {show('jobName') && (
        <td className={`${TD} py-[14.5px] pl-2`}>
          <Skeleton className="h-[14px] w-[100px] rounded-sm" />
        </td>
      )}
      {show('status') && (
        <td className={TD}>
          <Skeleton className="h-[14px] w-[120px] rounded-sm" />
        </td>
      )}
      {show('location') && (
        <td className={TD}>
          <Skeleton className="h-[14px] w-[80px] rounded-sm" />
        </td>
      )}
      {show('salary') && (
        <td className={TD}>
          <Skeleton className="h-[14px] w-[60px] rounded-sm" />
        </td>
      )}
      {show('workStyle') && (
        <td className={TD}>
          <Skeleton className="h-[14px] w-[70px] rounded-sm" />
        </td>
      )}
      {show('visa') && (
        <td className={TD}>
          <Skeleton className="h-[14px] w-[30px] rounded-sm" />
        </td>
      )}
      {show('applied') && (
        <td className={`${TD} ${lastVisible === 'applied' ? LAST_COL_PR : ''}`}>
          <Skeleton className="h-[14px] w-[55px] rounded-sm" />
        </td>
      )}
      {show('nextDeadline') && (
        <td
          className={`${TD} ${lastVisible === 'nextDeadline' ? LAST_COL_PR : ''}`}
        >
          <Skeleton className="h-[14px] w-[60px] rounded-sm" />
        </td>
      )}
      {show('timeInStage') && (
        <td
          className={`${TD} ${lastVisible === 'timeInStage' ? LAST_COL_PR : ''}`}
        >
          <Skeleton className="h-[14px] w-[60px] rounded-sm" />
        </td>
      )}
      {show('skills') && (
        <td className={`${TD} py-[14.5px] ${LAST_COL_PR}`}>
          <Skeleton className="h-[14px] w-[90px] rounded-sm" />
        </td>
      )}
    </tr>
  )
}

export function TableSkeleton({ hiddenColumns }: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} hiddenColumns={hiddenColumns} />
      ))}
    </>
  )
}
