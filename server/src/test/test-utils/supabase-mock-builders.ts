import { vi } from 'vitest'

export function createSelectBuilder(response: {
  data: unknown
  error: unknown
}) {
  const mockOrder = vi.fn().mockResolvedValue(response)
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { builder: { select: mockSelect }, mockEq, mockOrder }
}

export function createInsertBuilder(response: {
  data: unknown
  error: unknown
}) {
  const mockSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  return { builder: { insert: mockInsert }, mockInsert }
}

export function createUpdateBuilder(response: {
  data: unknown
  error: unknown
}) {
  const mockMaybeSingle = vi.fn().mockResolvedValue(response)
  const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockEq2 = vi.fn().mockReturnValue({ select: mockSelect })
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { update: mockUpdate }, mockUpdate, mockEq1, mockEq2 }
}

export function createCompactUpdateBuilder(response: { error: unknown }) {
  const mockEq2 = vi.fn().mockResolvedValue(response)
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { update: mockUpdate }, mockUpdate, mockEq1, mockEq2 }
}

export function createDeleteBuilder(response: { error: unknown }) {
  const mockEq2 = vi.fn().mockResolvedValue(response)
  const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
  return { builder: { delete: mockDelete }, mockDelete, mockEq1, mockEq2 }
}
