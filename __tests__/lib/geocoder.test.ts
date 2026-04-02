import { geocodePlace } from '@/lib/geocoder'

global.fetch = jest.fn()

describe('geocodePlace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_MAPS_API_KEY = 'fake-api-key'
  })

  it('returns coordinates for a known place', async () => {
    const mockResponse = {
      status: 'OK',
      results: [
        {
          geometry: {
            location: { lat: 37.5665, lng: 126.9780 },
          },
        },
      ],
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await geocodePlace('명동, 서울')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(37.5665)
    expect(result!.lng).toBeCloseTo(126.9780)
  })

  it('returns null on failure', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    })

    const result = await geocodePlace('non-existent-place-abc-123')
    expect(result).toBeNull()
  })

  it('returns null when API key is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    const result = await geocodePlace('any')
    expect(result).toBeNull()
  })
})
