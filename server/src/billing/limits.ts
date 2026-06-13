import type { Response } from 'express'
import type { Plan } from './plans'

export type LimitResource =
  | 'applications'
  | 'answers'
  | 'resumeVariations'
  | 'coverLetterVariations'
  | 'tokenDefinitions'
  | 'pdfExports'

const RESOURCE_LABELS: Record<LimitResource, string> = {
  applications: 'applications',
  answers: 'answers',
  resumeVariations: 'resume variations',
  coverLetterVariations: 'cover letter variations',
  tokenDefinitions: 'token definitions',
  pdfExports: 'PDF exports',
}

// Structured response the client detects (via `code: 'plan_limit'`) to surface an
// upgrade prompt instead of a generic error. Used for blocked creates, blocked
// exports, and direct access to data hidden behind a downgrade.
export function sendPlanLimit(
  res: Response,
  resource: LimitResource,
  limit: number,
  plan: Plan,
  status = 403,
): void {
  res.status(status).json({
    error: `You've reached your plan limit of ${limit} ${RESOURCE_LABELS[resource]}.`,
    code: 'plan_limit',
    resource,
    plan,
    limit,
  })
}
