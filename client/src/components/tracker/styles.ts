export const FIRST_COL_PL = 'pl-16'
export const LAST_COL_PR = 'pr-8'

export const COL_W = {
  star: '60px',
  company: '210px',
  jobName: '190px',
  status: '180px',
  location: '150px',
  salary: '130px',
  workStyle: '120px',
  visa: '85px',
  applied: '85px',
  nextDeadline: '110px',
  timeInStage: '100px',
  skills: '200px',
}

export const INPUT_BASE =
  'rounded border border-input-border-strong bg-input-subtle px-2 py-1.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground'

export const POPOVER_ITEM_CLASS =
  'flex h-[34px] w-full cursor-pointer items-center rounded px-2 text-left text-[14px] transition-colors hover:bg-muted'

export const TH =
  'sticky top-0 z-30 bg-background px-3 py-[9px] text-left font-mono text-[13px] font-medium text-text-faint uppercase whitespace-nowrap'

export const TD =
  'h-[44px] px-3 py-2 text-[14px] border-b border-border-faint align-middle whitespace-nowrap'

export function timeInStageColor(days: number) {
  if (days > 45) return 'text-danger'
  if (days > 30) return 'text-warning-strong'
  return 'text-foreground'
}
