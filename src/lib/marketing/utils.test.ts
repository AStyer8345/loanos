import { describe, it, expect } from 'vitest'
import {
  aprForProduct,
  cadenceColor,
  channelToType,
  buildRatesString,
  currentWeekBoundaries,
  formatDaysAgo,
  formatWeekLabel,
  todayString,
} from './utils'

describe('aprForProduct', () => {
  it('adds 0.07 offset for 30-Yr Fixed', () => {
    expect(aprForProduct('30-Yr Fixed', 6.875)).toBeCloseTo(6.945, 3)
  })
  it('adds 0.58 offset for FHA 30-Yr', () => {
    expect(aprForProduct('FHA 30-Yr', 6.375)).toBeCloseTo(6.955, 3)
  })
  it('adds 0.18 offset for VA 30-Yr', () => {
    expect(aprForProduct('VA 30-Yr', 6.25)).toBeCloseTo(6.43, 3)
  })
  it('returns rate unchanged for unknown product', () => {
    expect(aprForProduct('Unknown Product', 7.0)).toBe(7.0)
  })
})

describe('cadenceColor', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

  it('returns green when within freq', () => {
    expect(cadenceColor(daysAgo(5), 7)).toBe('green')
  })
  it('returns green on the freq boundary', () => {
    expect(cadenceColor(daysAgo(7), 7)).toBe('green')
  })
  it('returns gold when between freq and freq*1.5', () => {
    expect(cadenceColor(daysAgo(9), 7)).toBe('gold')   // 9 <= 10.5
  })
  it('returns red when over freq*1.5', () => {
    expect(cadenceColor(daysAgo(12), 7)).toBe('red')   // 12 > 10.5
  })
  it('returns red when null (never sent)', () => {
    expect(cadenceColor(null, 7)).toBe('red')
  })
  it('returns green for social-post within 2 days', () => {
    expect(cadenceColor(daysAgo(1), 2)).toBe('green')
  })
  it('returns red for social-post at 4 days (> 2*1.5=3)', () => {
    expect(cadenceColor(daysAgo(4), 2)).toBe('red')
  })
})

describe('channelToType', () => {
  it('maps Rate Update → Rate Update', () => {
    expect(channelToType('Rate Update')).toBe('Rate Update')
  })
  it('maps Email → Newsletter', () => {
    expect(channelToType('Email')).toBe('Newsletter')
  })
  it('maps Phone Call → Call', () => {
    expect(channelToType('Phone Call')).toBe('Call')
  })
  it('maps LinkedIn → Social', () => {
    expect(channelToType('LinkedIn')).toBe('Social')
  })
  it('maps Facebook → Social', () => {
    expect(channelToType('Facebook')).toBe('Social')
  })
  it('maps Task → Task', () => {
    expect(channelToType('Task')).toBe('Task')
  })
  it('maps Other → Task', () => {
    expect(channelToType('Other')).toBe('Task')
  })
  it('maps unknown values → Task', () => {
    expect(channelToType('Carrier Pigeon')).toBe('Task')
  })
})

describe('buildRatesString', () => {
  it('formats a full row with APR', () => {
    const rows = [{ product: '30-Yr Fixed', rate: '6.875', apr: '6.95' }]
    expect(buildRatesString(rows)).toBe('30-Yr Fixed: 6.875% | APR: 6.95%')
  })
  it('omits APR portion when apr is blank', () => {
    const rows = [{ product: '30-Yr Jumbo', rate: '7.0', apr: '' }]
    expect(buildRatesString(rows)).toBe('30-Yr Jumbo: 7.0%')
  })
  it('skips rows with empty rate', () => {
    const rows = [
      { product: '30-Yr Fixed', rate: '6.875', apr: '6.95' },
      { product: '15-Yr Fixed', rate: '',      apr: '' },
    ]
    expect(buildRatesString(rows)).toBe('30-Yr Fixed: 6.875% | APR: 6.95%')
  })
  it('joins multiple rows with newline', () => {
    const rows = [
      { product: '30-Yr Fixed', rate: '6.875', apr: '6.95' },
      { product: 'VA 30-Yr',   rate: '6.25',  apr: '6.43' },
    ]
    expect(buildRatesString(rows)).toBe(
      '30-Yr Fixed: 6.875% | APR: 6.95%\nVA 30-Yr: 6.25% | APR: 6.43%'
    )
  })
})

describe('currentWeekBoundaries', () => {
  it('returns a Monday as start', () => {
    const { start } = currentWeekBoundaries()
    expect(start.getDay()).toBe(1)   // 1 = Monday
  })
  it('returns a Sunday as end', () => {
    const { end } = currentWeekBoundaries()
    expect(end.getDay()).toBe(0)     // 0 = Sunday
  })
  it('start is before end', () => {
    const { start, end } = currentWeekBoundaries()
    expect(start.getTime()).toBeLessThan(end.getTime())
  })
  it('gap between start and end is 6 days', () => {
    const { start, end } = currentWeekBoundaries()
    const diffDays = (end.getTime() - start.getTime()) / 86400000
    expect(diffDays).toBeCloseTo(6.999, 0)
  })
})

describe('formatDaysAgo', () => {
  it('returns "Today" for current timestamp', () => {
    expect(formatDaysAgo(new Date().toISOString())).toBe('Today')
  })
  it('returns "Never" for null', () => {
    expect(formatDaysAgo(null)).toBe('Never')
  })
  it('returns "3d ago" for 3 days ago', () => {
    const ts = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(formatDaysAgo(ts)).toBe('3d ago')
  })
})

describe('formatWeekLabel', () => {
  it('formats a week range correctly', () => {
    const start = new Date(2026, 2, 17)  // Mar 17, 2026
    const end   = new Date(2026, 2, 23)  // Mar 23, 2026
    expect(formatWeekLabel(start, end)).toBe('Mar 17 – Mar 23, 2026')
  })
  it('handles month boundary', () => {
    const start = new Date(2026, 2, 30)  // Mar 30
    const end   = new Date(2026, 3, 5)   // Apr 5, 2026
    expect(formatWeekLabel(start, end)).toBe('Mar 30 – Apr 5, 2026')
  })
})

describe('todayString', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('returns today in local time (matches new Date() local components)', () => {
    const d = new Date()
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(todayString()).toBe(expected)
  })
})
