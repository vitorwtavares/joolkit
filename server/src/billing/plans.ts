export type Plan = 'free' | 'pro'

export interface PlanLimits {
  applications: number
  answers: number
  resumeVariations: number
  coverLetterVariations: number
  // null = unlimited (Pro). Substitutions inside documents are never capped.
  tokenDefinitions: number | null
  pdfExportsPerDay: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    applications: 50,
    answers: 4,
    resumeVariations: 1,
    coverLetterVariations: 1,
    tokenDefinitions: 2,
    pdfExportsPerDay: 1,
  },
  pro: {
    applications: 500,
    answers: 40,
    resumeVariations: 10,
    coverLetterVariations: 10,
    tokenDefinitions: null,
    pdfExportsPerDay: 25,
  },
}
