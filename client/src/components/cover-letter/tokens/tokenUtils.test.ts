import { describe, expect, it } from 'vitest'
import {
  dedupeCoverLetterTokensByKey,
  getDuplicateTokenKeyIds,
  getTokenValueMap,
} from './tokenUtils'

describe('getDuplicateTokenKeyIds', () => {
  it('returns an empty set when all keys are unique', () => {
    const duplicates = getDuplicateTokenKeyIds([
      { id: '1', key: 'role' },
      { id: '2', key: 'company' },
    ])

    expect(duplicates.size).toBe(0)
  })

  it('flags every row that shares a normalized key', () => {
    const duplicates = getDuplicateTokenKeyIds([
      { id: '1', key: 'role' },
      { id: '2', key: 'company' },
      { id: '3', key: 'Role' },
    ])

    expect([...duplicates]).toEqual(['1', '3'])
  })

  it('ignores empty keys', () => {
    const duplicates = getDuplicateTokenKeyIds([
      { id: '1', key: '' },
      { id: '2', key: '   ' },
      { id: '3', key: 'role' },
    ])

    expect(duplicates.size).toBe(0)
  })
})

describe('dedupeCoverLetterTokensByKey', () => {
  it('keeps the first value when duplicate keys include an empty row', () => {
    expect(
      dedupeCoverLetterTokensByKey([
        { key: 'role', value: 'Engineer' },
        { key: 'role', value: '' },
      ]),
    ).toEqual([{ key: 'role', value: 'Engineer' }])
  })

  it('preserves first-seen key order', () => {
    expect(
      dedupeCoverLetterTokensByKey([
        { key: 'company', value: 'Acme' },
        { key: 'role', value: 'Engineer' },
        { key: 'Company', value: 'Other' },
      ]),
    ).toEqual([
      { key: 'company', value: 'Acme' },
      { key: 'role', value: 'Engineer' },
    ])
  })
})

describe('getTokenValueMap', () => {
  it('uses the first value for duplicate keys', () => {
    expect(
      getTokenValueMap([
        { key: 'role', value: 'Engineer' },
        { key: 'role', value: '' },
      ]),
    ).toEqual({ role: 'Engineer' })
  })
})
