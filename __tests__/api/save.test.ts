import { POST } from '@/app/api/save/route'
import { NextRequest } from 'next/server'

// Prisma mock
jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(),
    channel: { upsert: jest.fn() },
    video: { upsert: jest.fn() },
    videoPlace: { deleteMany: jest.fn(), create: jest.fn() },
    place: { upsert: jest.fn() },
  },
}))

// fetchChannelInfo mock
jest.mock('@/lib/youtube', () => ({
  fetchChannelInfo: jest.fn().mockResolvedValue({
    channelId: '@test-channel',
    channelName: '테스트채널',
    channelUrl: 'https://www.youtube.com/@test-channel',
  }),
}))

import { db } from '@/lib/db'

const mockTransaction = db.$transaction as jest.Mock

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  videoId: 'test-video-id',
  videoTitle: '테스트 영상',
  items: [
    {
      id: '1',
      timestamp: 60,
      place: '세나도 광장',
      city: 'Macau',
      country: 'China',
      countryCode: 'MO',
      description: '테스트 장소',
      lat: 22.193,
      lng: 113.54,
      hasCoords: true,
      googlePlaceId: 'ChIJtest',
    },
  ],
}

describe('POST /api/save', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        channel: { upsert: jest.fn().mockResolvedValue({ id: 'channel-uuid' }) },
        video: { upsert: jest.fn().mockResolvedValue({ id: 'video-uuid' }) },
        videoPlace: { deleteMany: jest.fn(), create: jest.fn() },
        place: { upsert: jest.fn().mockResolvedValue({ id: 'place-uuid' }) },
      }
      return fn(tx)
    })
  })

  it('returns success with savedCount on valid request', async () => {
    const res = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.savedCount).toBe(1)
  })

  it('returns 400 on invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/save', {
      method: 'POST',
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when videoId is missing', async () => {
    const res = await POST(makeRequest({ videoTitle: '제목', items: [] }))
    expect(res.status).toBe(400)
  })

  it('handles hasCoords=false items (no Place upsert)', async () => {
    const body = {
      ...validBody,
      items: [{
        ...validBody.items[0],
        hasCoords: false,
        googlePlaceId: undefined,
      }],
    }

    const res = await POST(makeRequest(body))
    const data = await res.json()

    expect(data.success).toBe(true)
    // transaction이 호출됐는지만 확인 (place.upsert 미호출은 통합 테스트에서 검증)
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('returns 500 when transaction fails', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('DB connection failed'))

    const res = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('DB connection failed')
  })
})
