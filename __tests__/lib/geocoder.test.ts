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

  it('parses city, country, countryCode, and address from address_components', async () => {
    const mockResponse = {
      status: 'OK',
      results: [
        {
          geometry: { location: { lat: 35.6762, lng: 139.6503 } },
          formatted_address: '東京都, 日本',
          address_components: [
            { types: ['locality'], long_name: '東京都', short_name: '東京都' },
            { types: ['country'], long_name: 'Japan', short_name: 'JP' },
          ],
        },
      ],
    }
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await geocodePlace('Tokyo')
    expect(result).not.toBeNull()
    expect(result!.city).toBe('東京都')
    expect(result!.country).toBe('Japan')
    expect(result!.countryCode).toBe('JP')
    expect(result!.address).toBe('東京都, 日本')
  })

  it('uses administrative_area_level_1 when locality is absent', async () => {
    const mockResponse = {
      status: 'OK',
      results: [
        {
          geometry: { location: { lat: 51.5, lng: -0.1 } },
          formatted_address: 'London, UK',
          address_components: [
            { types: ['administrative_area_level_1'], long_name: 'England', short_name: 'ENG' },
            { types: ['country'], long_name: 'United Kingdom', short_name: 'GB' },
          ],
        },
      ],
    }
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await geocodePlace('London')
    expect(result!.city).toBe('England')
    expect(result!.countryCode).toBe('GB')
  })

  it('returns null on network error', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('network fail'))
    const result = await geocodePlace('Tokyo')
    expect(result).toBeNull()
  })

  it('uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY when GOOGLE_MAPS_API_KEY is absent', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'public-fake-key'
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 1, lng: 2 } }, formatted_address: 'Test', address_components: [] }],
      }),
    })
    const result = await geocodePlace('test')
    expect(result).not.toBeNull()
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  })
})
