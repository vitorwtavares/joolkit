import { supabase } from './supabase'

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
}

export function getApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Resources the server caps and reports in structured `plan_limit` errors.
export type PlanLimitResource =
  | 'applications'
  | 'answers'
  | 'resumeVariations'
  | 'coverLetterVariations'
  | 'tokenDefinitions'
  | 'pdfExports'

interface PlanLimitDetails {
  resource: PlanLimitResource
  plan: 'free' | 'pro'
  limit: number
}

export class ApiError extends Error {
  status: number
  // Set when the server returns a structured `{ code: 'plan_limit', ... }` body,
  // so the client can surface an upgrade prompt instead of a generic error.
  planLimit?: PlanLimitDetails

  constructor(message: string, status: number, planLimit?: PlanLimitDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.planLimit = planLimit
  }
}

function planLimitFromBody(body: {
  code?: string
  resource?: PlanLimitResource
  plan?: 'free' | 'pro'
  limit?: number
}): PlanLimitDetails | undefined {
  if (body.code !== 'plan_limit' || !body.resource) return undefined
  return {
    resource: body.resource,
    plan: body.plan ?? 'free',
    limit: body.limit ?? 0,
  }
}

export function isPlanLimitError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.planLimit !== undefined
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const hasBody = options.body !== undefined
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      body.error ?? `Request failed: ${res.status}`,
      res.status,
      planLimitFromBody(body),
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function requestBlob(
  path: string,
  options: RequestInit = {},
): Promise<Blob> {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      body.error ?? `Request failed: ${res.status}`,
      res.status,
      planLimitFromBody(body),
    )
  }

  return res.blob()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postBlob: (path: string) => requestBlob(path, { method: 'POST' }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
