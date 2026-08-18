// Candidate matching for duplicate contact detection (v2).
//
// Exact-name and exact-email groups come from the `find_duplicate_contacts` RPC.
// This module adds the two match types the RPC does not cover:
//   - `phone`      — identical 10-digit US number once formatting is stripped
//   - `fuzzy_name` — same last name plus a first-name variant (Tim/Timothy)
//
// Precision over recall on the fuzzy rule: bucketing on last name + first
// initial was measured against the live book (2,466 contacts) and produced 72
// candidate groups that were overwhelmingly unrelated people (Jennifer/Jerry
// Brooks, Amy/Ashley/Austin Smith). Requiring an actual first-name variant
// produces 4. A duplicate scan nobody trusts gets ignored.

export type MatchType = 'name' | 'email' | 'phone' | 'fuzzy_name'

export type DupeContact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  created_at: string
  updated_at: string
}

export type DupeGroup = {
  group_key: string
  match_type: MatchType
  contacts: DupeContact[]
}

export function normalizeNamePart(value: string | null): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

// Returns the 10-digit national number, or null when the value can't be one.
export function normalizePhoneKey(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return national.length === 10 ? national : null
}

export function formatPhoneKey(key: string): string {
  return `(${key.slice(0, 3)}) ${key.slice(3, 6)}-${key.slice(6)}`
}

// True when a and b differ by exactly one insertion, deletion, or substitution.
function differsByOneEdit(a: string, b: string): boolean {
  if (a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false

  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1
      j += 1
      continue
    }
    edits += 1
    if (edits > 1) return false
    if (a.length === b.length) {
      i += 1
      j += 1
    } else if (a.length > b.length) {
      i += 1
    } else {
      j += 1
    }
  }
  return edits + (a.length - i) + (b.length - j) === 1
}

// Nickname/typo forms of the same first name: Tim/Timothy, Chris/Christopher,
// Kathryn/Katheryn. The length floors deliberately give up on 3-letter typo
// pairs (jon/john is missed) because dropping to 3 also pairs jim/tim, bob/rob,
// and amy/ami — a missed candidate costs nothing, a wrong merge costs a record.
export function isFirstNameVariant(a: string, b: string): boolean {
  if (!a || !b || a === b) return false
  const shortest = Math.min(a.length, b.length)
  if (shortest >= 3 && (a.startsWith(b) || b.startsWith(a))) return true
  return shortest >= 4 && differsByOneEdit(a, b)
}

// Same ordering the RPC uses — the merge UI pre-selects contacts[0] as the keep.
function byUpdatedDesc(rows: DupeContact[]): DupeContact[] {
  return [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export function groupSignature(group: DupeGroup): string {
  return group.contacts
    .map(c => c.id)
    .sort()
    .join('|')
}

// A shared phone number is not on its own evidence of a duplicate — spouses,
// co-borrowers, and office lines all collide. Measured on the live book: of 30
// shared-number groups, 11 were plainly two different people. Requiring some
// corroborating name signal keeps 19 and drops those 11. Merging two real
// people's records is the expensive mistake here, not missing a candidate.
export function sharesNameSignal(a: DupeContact, b: DupeContact): boolean {
  const aFirst = normalizeNamePart(a.first_name)
  const bFirst = normalizeNamePart(b.first_name)
  const aLast = normalizeNamePart(a.last_name)
  const bLast = normalizeNamePart(b.last_name)
  // A record missing half its name can't be ruled out, and name-less web leads
  // are among the likeliest duplicates of all.
  if (!aFirst || !bFirst || !aLast || !bLast) return true
  if (aLast === bLast || aFirst === bFirst) return true
  return isFirstNameVariant(aFirst, bFirst)
}

function anyPairSharesNameSignal(rows: DupeContact[]): boolean {
  return rows.some((row, i) => rows.slice(i + 1).some(other => sharesNameSignal(row, other)))
}

export function findPhoneGroups(rows: DupeContact[]): DupeGroup[] {
  const buckets = new Map<string, DupeContact[]>()
  for (const row of rows) {
    const key = normalizePhoneKey(row.phone)
    if (!key) continue
    const bucket = buckets.get(key)
    if (bucket) bucket.push(row)
    else buckets.set(key, [row])
  }

  const groups: DupeGroup[] = []
  for (const [key, bucket] of buckets) {
    if (bucket.length < 2) continue
    if (!anyPairSharesNameSignal(bucket)) continue
    groups.push({
      group_key: formatPhoneKey(key),
      match_type: 'phone',
      contacts: byUpdatedDesc(bucket),
    })
  }
  return groups.sort((a, b) => a.group_key.localeCompare(b.group_key))
}

export function findFuzzyNameGroups(rows: DupeContact[]): DupeGroup[] {
  const byLastName = new Map<string, { first: string; row: DupeContact }[]>()
  for (const row of rows) {
    const last = normalizeNamePart(row.last_name)
    const first = normalizeNamePart(row.first_name)
    if (last.length < 2 || first.length < 2) continue
    const bucket = byLastName.get(last)
    if (bucket) bucket.push({ first, row })
    else byLastName.set(last, [{ first, row }])
  }

  const groups: DupeGroup[] = []
  for (const [last, entries] of byLastName) {
    if (entries.length < 2) continue

    const clusters: { firsts: Set<string>; rows: DupeContact[] }[] = []
    for (const entry of entries) {
      const cluster = clusters.find(c =>
        [...c.firsts].some(first => first === entry.first || isFirstNameVariant(first, entry.first))
      )
      if (cluster) {
        cluster.firsts.add(entry.first)
        cluster.rows.push(entry.row)
      } else {
        clusters.push({ firsts: new Set([entry.first]), rows: [entry.row] })
      }
    }

    for (const cluster of clusters) {
      // Identical first names are already an exact `name` match from the RPC.
      if (cluster.rows.length < 2 || cluster.firsts.size < 2) continue
      const label = [...cluster.firsts].sort().join(' / ')
      groups.push({
        group_key: `${label} ${last}`,
        match_type: 'fuzzy_name',
        contacts: byUpdatedDesc(cluster.rows),
      })
    }
  }
  return groups.sort((a, b) => a.group_key.localeCompare(b.group_key))
}
