import { Skeleton } from '@/components/ui/skeleton'
import { TD, FIRST_COL_PL, LAST_COL_PR } from './styles'

export function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} data-skeleton="true">
          <td className={`${TD} ${FIRST_COL_PL}`}>
            <Skeleton className="h-[14px] w-[14px] rounded-sm" />
          </td>
          <td className={`${TD} pl-2`}>
            <Skeleton className="h-[14px] w-[120px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[120px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[80px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[60px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[70px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[30px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[55px] rounded-sm" />
          </td>
          <td className={TD}>
            <Skeleton className="h-[14px] w-[60px] rounded-sm" />
          </td>
          <td className={`${TD} ${LAST_COL_PR}`}>
            <Skeleton className="h-[14px] w-[90px] rounded-sm" />
          </td>
        </tr>
      ))}
    </>
  )
}
