export const FIRST_COL_PL = 'pl-16'
export const LAST_COL_PR = 'pr-8'

export const COL_W = {
  star: '60px',
  company: '170px',
  jobName: '190px',
  status: '170px',
  location: '150px',
  salary: '130px',
  workStyle: '120px',
  visa: '85px',
  applied: '85px',
  timeInStage: '100px',
  skills: '200px',
}

export const INPUT_BASE =
  'rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground'

export const POPOVER_ITEM_CLASS =
  'flex h-[34px] w-full cursor-pointer items-center rounded px-2 text-left text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.06)]'

export const TH =
  'px-3 py-[9px] text-left text-[14px] font-medium text-muted-foreground uppercase tracking-[0.04em] whitespace-nowrap bg-background sticky top-0 z-10'

export const TD =
  'h-[44px] px-3 py-2 text-[14px] border-b border-[rgba(255,255,255,0.04)] align-middle whitespace-nowrap'

export function timeInStageColor(days: number) {
  if (days > 45) return 'text-[#f09595]'
  if (days > 30) return 'text-[#f0c040]'
  return 'text-foreground'
}
