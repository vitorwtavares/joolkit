export function getDaysInStage(lastMovedAt: string | null): number {
  if (!lastMovedAt) return 0
  return Math.floor((Date.now() - new Date(lastMovedAt).getTime()) / 86_400_000)
}

export function formatTimeInStage(lastMovedAt: string | null): string {
  if (!lastMovedAt) return '—'
  const days = getDaysInStage(lastMovedAt)
  if (days <= 0) return 'Moved today'
  if (days === 1) return '1 day'
  return `${days} days`
}
