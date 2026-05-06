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

export const TH =
  'px-3 py-[9px] text-left text-[14px] font-medium text-muted-foreground uppercase tracking-[0.04em] whitespace-nowrap bg-background sticky top-0 z-10'

export const TD =
  'h-[44px] px-3 py-2 text-[14px] border-b border-[rgba(255,255,255,0.04)] align-middle whitespace-nowrap'

export function timeInStageColor(days: number) {
  if (days > 45) return 'text-[#f09595]'
  if (days > 30) return 'text-[#f0c040]'
  return 'text-foreground'
}
