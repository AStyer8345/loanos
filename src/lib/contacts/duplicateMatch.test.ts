import { describe, expect, it } from 'vitest'
import {
  findFuzzyNameGroups,
  findPhoneGroups,
  groupSignature,
  isFirstNameVariant,
  normalizeNamePart,
  normalizePhoneKey,
  type DupeContact,
} from './duplicateMatch'

function contact(over: Partial<DupeContact> & { id: string }): DupeContact {
  return {
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    contact_type: null,
    stage: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

describe('normalizePhoneKey', () => {
  it('reduces formatted US numbers to the same 10-digit key', () => {
    expect(normalizePhoneKey('(512) 555-1234')).toBe('5125551234')
    expect(normalizePhoneKey('512.555.1234')).toBe('5125551234')
    expect(normalizePhoneKey('+1 512 555 1234')).toBe('5125551234')
  })

  it('rejects values that cannot be a national number', () => {
    expect(normalizePhoneKey(null)).toBeNull()
    expect(normalizePhoneKey('')).toBeNull()
    expect(normalizePhoneKey('555-1234')).toBeNull()
    expect(normalizePhoneKey('+44 20 7946 0958')).toBeNull()
  })
})

describe('normalizeNamePart', () => {
  it('strips accents, case, and punctuation', () => {
    expect(normalizeNamePart('  José ')).toBe('jose')
    expect(normalizeNamePart("O'Brien")).toBe('obrien')
    expect(normalizeNamePart(null)).toBe('')
  })
})

describe('isFirstNameVariant', () => {
  it('matches nickname and single-typo forms', () => {
    expect(isFirstNameVariant('tim', 'timothy')).toBe(true)
    expect(isFirstNameVariant('chris', 'christopher')).toBe(true)
    expect(isFirstNameVariant('russ', 'russell')).toBe(true)
    expect(isFirstNameVariant('kathryn', 'katheryn')).toBe(true)
  })

  it('gives up on 3-letter typo pairs rather than risk merging two people', () => {
    // The edit-distance rule floors at 4 characters, so jon/john is missed.
    // Dropping to 3 would also pair jim/tim, bob/rob, and dan/don — a missed
    // candidate costs nothing, a wrong merge destroys a contact record.
    expect(isFirstNameVariant('jon', 'john')).toBe(false)
    expect(isFirstNameVariant('jim', 'tim')).toBe(false)
    expect(isFirstNameVariant('bob', 'rob')).toBe(false)
  })

  it('does not match distinct people who share a first initial', () => {
    expect(isFirstNameVariant('jennifer', 'jerry')).toBe(false)
    expect(isFirstNameVariant('michelle', 'manuel')).toBe(false)
    expect(isFirstNameVariant('bob', 'robert')).toBe(false)
    expect(isFirstNameVariant('amy', 'ami')).toBe(false) // under the 4-char edit floor
    expect(isFirstNameVariant('tim', 'tim')).toBe(false) // exact name is the RPC's job
    expect(isFirstNameVariant('', 'timothy')).toBe(false)
  })
})

describe('findPhoneGroups', () => {
  it('groups differently formatted copies of one number', () => {
    const groups = findPhoneGroups([
      contact({ id: 'a', first_name: 'Dana', last_name: 'Reed', phone: '(512) 555-1234', updated_at: '2026-02-01T00:00:00Z' }),
      contact({ id: 'b', first_name: 'Dana', last_name: 'Reed', phone: '+15125551234', updated_at: '2026-03-01T00:00:00Z' }),
      contact({ id: 'c', phone: '512-555-9999' }),
      contact({ id: 'd', phone: null }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].match_type).toBe('phone')
    expect(groups[0].group_key).toBe('(512) 555-1234')
    // Most recently updated first — the merge UI pre-selects contacts[0] as the keep.
    expect(groups[0].contacts.map(c => c.id)).toEqual(['b', 'a'])
  })

  it('ignores two different people who share a number', () => {
    // Spouses with different surnames, co-borrowers, and shared office lines.
    const groups = findPhoneGroups([
      contact({ id: 'a', first_name: 'Marcus', last_name: 'Webb', phone: '512-555-4321' }),
      contact({ id: 'b', first_name: 'Priya', last_name: 'Ganesan', phone: '512-555-4321' }),
    ])

    expect(groups).toEqual([])
  })

  it('keeps a shared number when one record is missing a name half', () => {
    const groups = findPhoneGroups([
      contact({ id: 'a', first_name: 'Aurinder', last_name: null, phone: '512-555-7777' }),
      contact({ id: 'b', first_name: 'Aurinder', last_name: 'Chohan', phone: '512-555-7777' }),
    ])

    expect(groups).toHaveLength(1)
  })

  it('keeps spouses who share a surname for review rather than dropping them', () => {
    // These are usually not duplicates, but the surname match is real signal and
    // the merge UI shows both rows before anything is merged.
    const groups = findPhoneGroups([
      contact({ id: 'a', first_name: 'Michelle', last_name: 'Lopez', phone: '512-555-2222' }),
      contact({ id: 'b', first_name: 'Manuel', last_name: 'Lopez', phone: '512-555-2222' }),
    ])

    expect(groups).toHaveLength(1)
  })
})

describe('findFuzzyNameGroups', () => {
  it('surfaces a nickname pair sharing a last name', () => {
    const groups = findFuzzyNameGroups([
      contact({ id: 'a', first_name: 'Tim', last_name: 'Heyl' }),
      contact({ id: 'b', first_name: 'Timothy', last_name: 'Heyl' }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].match_type).toBe('fuzzy_name')
    expect(groups[0].group_key).toBe('tim / timothy heyl')
  })

  it('ignores same-initial strangers and exact-name duplicates', () => {
    const groups = findFuzzyNameGroups([
      contact({ id: 'a', first_name: 'Jennifer', last_name: 'Brooks' }),
      contact({ id: 'b', first_name: 'Jerry', last_name: 'Brooks' }),
      contact({ id: 'c', first_name: 'John', last_name: 'Smith' }),
      contact({ id: 'd', first_name: 'john', last_name: 'smith' }),
    ])

    expect(groups).toEqual([])
  })

  it('clusters three variants of one person into a single group', () => {
    const groups = findFuzzyNameGroups([
      contact({ id: 'a', first_name: 'Chris', last_name: 'Solarz' }),
      contact({ id: 'b', first_name: 'Christopher', last_name: 'Solarz' }),
      contact({ id: 'c', first_name: 'Christophe', last_name: 'Solarz' }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].contacts).toHaveLength(3)
  })
})

describe('groupSignature', () => {
  it('is stable regardless of member order', () => {
    const a = contact({ id: '1' })
    const b = contact({ id: '2' })
    expect(groupSignature({ group_key: 'x', match_type: 'phone', contacts: [a, b] })).toBe(
      groupSignature({ group_key: 'y', match_type: 'fuzzy_name', contacts: [b, a] })
    )
  })
})
