import { formatTimestamp, getFlagEmoji } from '@/lib/format'

describe('formatTimestamp', () => {
  it('converts seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00')
    expect(formatTimestamp(90)).toBe('01:30')
    expect(formatTimestamp(468)).toBe('07:48')
  })

  it('handles hours as HH:MM:SS', () => {
    expect(formatTimestamp(3661)).toBe('01:01:01')
    expect(formatTimestamp(7200)).toBe('02:00:00')
  })
})

describe('getFlagEmoji', () => {
  it('returns flag emoji for country code', () => {
    expect(getFlagEmoji('KR')).toBe('🇰🇷')
    expect(getFlagEmoji('JP')).toBe('🇯🇵')
    expect(getFlagEmoji('US')).toBe('🇺🇸')
  })

  it('returns empty string for unknown codes', () => {
    expect(getFlagEmoji('')).toBe('')
    expect(getFlagEmoji('XX')).toBe('🇽🇽')  // regional indicators still combine
  })
})
