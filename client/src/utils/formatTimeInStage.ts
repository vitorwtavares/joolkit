export function formatTimeInStage(lastMovedAt: string | null): string {
  if (!lastMovedAt) return '—'
  const days = Math.floor(
    (Date.now() - new Date(lastMovedAt).getTime()) / 86_400_000,
  )
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}
