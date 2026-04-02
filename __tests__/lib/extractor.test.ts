import { extractLocations } from '@/lib/extractor'

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify([
            {
              timestamp: 120,
              place: '명동',
              city: '서울',
              country: '대한민국',
              countryCode: 'KR',
              description: '서울 명동 쇼핑 거리',
            }
          ])
        }]
      })
    }
  }))
})

describe('extractLocations', () => {
  it('returns array of location items from transcript', async () => {
    const result = await extractLocations('some transcript text', [])
    expect(result).toHaveLength(1)
    expect(result[0].place).toBe('명동')
    expect(result[0].city).toBe('서울')
    expect(result[0].countryCode).toBe('KR')
    expect(result[0].timestamp).toBe(120)
  })

  it('returns empty array on invalid JSON response', async () => {
    const Anthropic = require('@anthropic-ai/sdk')
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'not valid json' }]
        })
      }
    }))
    const result = await extractLocations('transcript', [])
    expect(result).toEqual([])
  })
})
